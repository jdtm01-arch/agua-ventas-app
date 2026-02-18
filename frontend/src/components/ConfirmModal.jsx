import React, { useEffect, useRef, useState } from 'react'

export default function ConfirmModal({ open, title = 'Confirmar', message = '', confirmText = 'Confirmar', cancelText = 'Cancelar', onConfirm, onCancel, danger = false }){
  const ref = useRef(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(()=>{
    if (open) {
      setIsOpen(true)
      setTimeout(()=>{ try{ ref.current && ref.current.focus() }catch(e){} }, 10)
    } else {
      setIsOpen(false)
    }
  }, [open])

  if (!open) return null

  return (
    <div className={`modal-backdrop ${isOpen? 'open':''}`}>
      <div ref={ref} tabIndex={-1} className={`modal-dialog ${isOpen? 'open':''}`} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h3 id="confirm-title" className="confirm-title">
          <span className="confirm-icon" aria-hidden>
            <i className="fi fi-ss-triangle-warning" aria-hidden></i>
          </span>
          {title}
        </h3>
        {message && <div className="modal-message">{message}</div>}
        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onCancel}>{cancelText}</button>
          <button type="button" className={`btn-primary ${danger ? 'btn-danger' : ''}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}
