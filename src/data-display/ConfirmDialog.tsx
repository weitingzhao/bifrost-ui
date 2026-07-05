import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { useEffect, useRef, type ReactNode } from 'react'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  confirming?: boolean
  bodyExtra?: ReactNode
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  confirming = false,
  bodyExtra,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const openedAtRef = useRef(0)

  useEffect(() => {
    if (open) {
      openedAtRef.current = Date.now()
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onCancel() }}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(event) => {
          // Opening from an external button can emit an outside pointer event on the same click.
          if (Date.now() - openedAtRef.current < 400) {
            event.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        {bodyExtra ? <div className="py-1">{bodyExtra}</div> : null}
        <DialogFooter>
          <Button variant="outline" disabled={confirming} onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={confirming} onClick={onConfirm}>
            {confirming ? '…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
