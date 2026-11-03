import { useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion, useDragControls } from 'motion/react'

// Phones expect the back gesture/button to close the top-most sheet, not leave the app.
// Each open sheet pushes a history entry; back pops only the top one.
const stack: { close: () => void }[] = []
let ignorePops = 0
let pendingBack = 0

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    if (ignorePops > 0) {
      ignorePops--
      return
    }
    stack.pop()?.close()
  })
}

function scheduleBack() {
  pendingBack++
  if (pendingBack === 1) {
    queueMicrotask(() => {
      const n = pendingBack
      pendingBack = 0
      ignorePops++
      history.go(-n)
    })
  }
}

export function useBackClose(open: boolean, onClose: () => void) {
  const cb = useRef(onClose)
  cb.current = onClose
  useEffect(() => {
    if (!open) return
    const entry = { close: () => cb.current() }
    stack.push(entry)
    history.pushState({ morselSheet: true }, '')
    return () => {
      const i = stack.indexOf(entry)
      if (i !== -1) {
        stack.splice(i, 1)
        scheduleBack()
      }
    }
  }, [open])
}

interface Props {
  open: boolean
  onClose: () => void
  label: string
  full?: boolean
  children: ReactNode
}

export function Sheet({ open, onClose, label, full, children }: Props) {
  useBackClose(open, onClose)
  const drag = useDragControls()
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className={`sheet${full ? ' full' : ''}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 34, stiffness: 360 }}
            drag="y"
            dragListener={false}
            dragControls={drag}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose()
            }}
          >
            <div className="grab" onPointerDown={(e) => drag.start(e)} aria-hidden="true" />
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
