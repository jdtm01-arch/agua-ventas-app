import React, { useState, useEffect, useRef } from 'react'
import api from '../api'

export default function EditGastoModal({ token, gasto, tipos = [], onClose, onSaved }){
  const dialogRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [tipo, setTipo] = useState(gasto?.tipo_de_gasto_id ?? '')
  const [monto, setMonto] = useState(gasto?.monto ?? '')
  const [date, setDate] = useState(gasto?.created_at ? new Date(gasto.created_at).toISOString().slice(0,10) : new Date().toISOString().slice(0,10))
  const [descripcion, setDescripcion] = useState(gasto?.descripcion ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(()=>{
    setTipo(gasto?.tipo_de_gasto_id ?? '')
    setMonto(gasto?.monto ?? '')
    function extractDatePart(ts){ if (!ts) return new Date().toISOString().slice(0,10); const m = String(ts).match(/^(\d{4}-\d{2}-\d{2})/); if (m) return m[1]; try { return new Date(ts).toISOString().slice(0,10) } catch(e){ return new Date().toISOString().slice(0,10) } }
    setDate(extractDatePart(gasto?.created_at))
    setDescripcion(gasto?.descripcion ?? '')
    setTimeout(()=> setIsOpen(true), 10)
    try{ dialogRef.current?.focus() }catch(e){}
  }, [gasto])

  if (!gasto) return null

  async function submit(e){
    e.preventDefault()
    setSaving(true)
    setError(null)
    try{
      if (!tipo) { setError('Seleccione tipo'); setSaving(false); return }
      const p = parseFloat(monto)
      if (isNaN(p) || p <= 0) { setError('Monto inválido'); setSaving(false); return }
      const re = /^\d{4}-\d{2}-\d{2}$/
      if (date && !re.test(date)) { setError('Formato de fecha inválido'); setSaving(false); return }
      const payload = { tipo_de_gasto_id: tipo, monto: Number(monto), descripcion: descripcion ? descripcion.trim() : '', date: date ? `${date}T00:00:00-05:00` : undefined }
      await api.updateGasto(gasto.id, payload, token)
      onSaved && onSaved()
      onClose && onClose()
    }catch(err){
      console.error('update gasto error', err)
      setError(err?.data?.message || 'Error actualizando gasto')
    }finally{ setSaving(false) }
  }

  return (
    <div className={`modal-backdrop ${isOpen? 'open':''}`}>
      <div ref={dialogRef} tabIndex={-1} className={`modal-dialog ${isOpen? 'open':''}`}>
        <h3>Editar Gasto Nro: <span className="modal-id">{gasto.id}</span></h3>
        {error && <div className="text-danger">{error}</div>}
        <form onSubmit={submit}>
          <div className="mb-8">
            <label>Tipo
              <select value={tipo} onChange={e=>setTipo(e.target.value)}>
                <option value="">Seleccione tipo</option>
                {tipos.map(t=> <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </label>
          </div>
          <div className="mb-8">
            <label>Monto (S/)
              <input type="text" inputMode="decimal" placeholder="Monto (S/)" value={monto} onChange={e=>setMonto(e.target.value)} required />
            </label>
          </div>
          <div className="mb-8">
            <label>Fecha
              <input type="date" placeholder="YYYY-MM-DD" value={date} onChange={e=>setDate(e.target.value)} />
            </label>
          </div>
          <div className="mb-8">
            <label>Descripción
              <input placeholder="Descripción" value={descripcion} onChange={e=>setDescripcion(e.target.value)} />
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
