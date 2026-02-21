import React, { useState, useEffect, useRef } from 'react'
import api from '../api'

export default function EditVentaModal({ token, venta, onClose, onSaved }){
  const dialogRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [monto, setMonto] = useState(venta?.monto ?? '')
  const [status, setStatus] = useState(venta?.status ?? 'pendiente')
  const [tipo, setTipo] = useState(venta?.tipo_venta ?? 'recarga')
  const [date, setDate] = useState(venta?.created_at ? new Date(venta.created_at).toISOString().slice(0,10) : new Date().toISOString().slice(0,10))
  const [descripcion, setDescripcion] = useState(venta?.descripcion ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(()=>{
    setMonto(venta?.monto ?? '')
    setStatus(venta?.status ?? 'pendiente')
    setTipo(venta?.tipo_venta ?? 'recarga')
    setDescripcion(venta?.descripcion ?? '')
    function extractDatePart(ts){
      if (!ts) return new Date().toISOString().slice(0,10)
      const m = String(ts).match(/^(\d{4}-\d{2}-\d{2})/)
      if (m) return m[1]
      try { return new Date(ts).toISOString().slice(0,10) } catch(e){ return new Date().toISOString().slice(0,10) }
    }
    setDate(extractDatePart(venta?.created_at))
    // open transition and focus
    setTimeout(()=> setIsOpen(true), 10)
    if (dialogRef.current) {
      // focusable container
      try{ dialogRef.current.focus() }catch(e){}
    }
  }, [venta])

  if (!venta) return null

  async function submit(e){
    e.preventDefault()
    setSaving(true)
    setError(null)
    try{
      // Primero actualizamos los campos de la venta (monto, tipo, fecha)
      // Esto es importante porque las políticas de autorización pueden rechazar cambios
      // después de que el status sea "pagado"
      const updates = {}
      if (Number(monto) !== Number(venta.monto)) updates.monto = Number(monto)
      if (tipo !== venta.tipo_venta) updates.tipo_venta = tipo
      if (descripcion !== (venta.descripcion ?? '')) updates.descripcion = descripcion
      
      // Validar formato de fecha (YYYY-MM-DD)
      const re = /^\d{4}-\d{2}-\d{2}$/
      if (date && !re.test(date)) {
        setError('Formato de fecha inválido. Use YYYY-MM-DD')
        setSaving(false)
        return
      }
      function extractDatePart(ts){
        if (!ts) return null
        const m = String(ts).match(/^(\d{4}-\d{2}-\d{2})/)
        if (m) return m[1]
        try { return new Date(ts).toISOString().slice(0,10) } catch(e){ return null }
      }
      const current = extractDatePart(venta.created_at)
      if (date && date !== current) updates.date = `${date}T00:00:00-05:00`
      
      // Actualizar los campos de la venta primero
      if (Object.keys(updates).length) {
        await api.updateVenta(venta.id, updates, token)
      }
      
      // Finalmente, actualizar el status al último
      // Esto es lo último para evitar que se rechacen otros cambios después de cambiar a "pagado"
      if (status !== venta.status){
        await api.updateStatus(venta.id, { status }, token)
      }
      
      onSaved && onSaved()
      onClose && onClose()
    }catch(err){
      console.error('update venta error', err)
      const errStatus = err?.status
      if (errStatus === 403) {
        setError('No tienes permisos para editar esta venta. Verifica que seas el propietario o que tengas permisos de administrador.')
      } else if (errStatus === 404) {
        setError('La venta no existe o fue eliminada.')
      } else if (errStatus === 422) {
        setError(err?.data?.message || 'Datos inválidos. Por favor verifica los valores ingresados.')
      } else {
        setError('Error al actualizar la venta. Por favor intenta nuevamente.')
      }
    }finally{
      setSaving(false)
    }
  }

  return (
    <div className={`modal-backdrop ${isOpen? 'open':''}`}>
      <div ref={dialogRef} tabIndex={-1} className={`modal-dialog ${isOpen? 'open':''}`}>
        <h3>Editar Venta Nro: <span className="modal-id">{venta.id}</span></h3>
        {error && <div className="text-danger">{error}</div>}
        <form onSubmit={submit}>
          <div className="mb-8">
            <label>Cliente: <strong>{venta.cliente?.nombre || venta.cliente_id}</strong></label>
          </div>
          <div className="mb-8">
            <label>Tipo
              <select value={tipo} onChange={e=>setTipo(e.target.value)}>
                <option value="recarga">Recarga</option>
                <option value="primera">Primera</option>
              </select>
            </label>
          </div>
          <div className="mb-8">
            <label>Status
              <select value={status} onChange={e=>setStatus(e.target.value)}>
                <option value="pendiente">Pendiente</option>
                <option value="entregado">Entregado</option>
                <option value="pagado">Pagado</option>
              </select>
            </label>
          </div>
          <div className="mb-8">
            <label>Monto (S/)
              <input type="number" step="0.1" placeholder="Monto (S/)" value={monto} onChange={e=>setMonto(e.target.value)} required/>
            </label>
          </div>
          <div className="mb-8">
            <label>Fecha
              <input type="date" placeholder="YYYY-MM-DD" value={date} onChange={e=>setDate(e.target.value)} />
            </label>
            <div style={{fontSize:12,color:'#666'}}>Zona horaria: America/Lima (GMT-5)</div>
          </div>
          <div className="mb-8">
            <label>Descripción (máximo 500 caracteres)
              <textarea 
                placeholder="Descripción de la venta (opcional)"
                value={descripcion}
                onChange={e=>{
                  let v = e.target.value
                  if (v.length <= 500) setDescripcion(v)
                  else setDescripcion(v.slice(0, 500))
                }}
                maxLength={500}
                style={{minHeight:'80px', resize:'vertical'}}
              />
              <div style={{fontSize:12, color:'#666', marginTop:4}}>{descripcion.length}/500</div>
            </label>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
