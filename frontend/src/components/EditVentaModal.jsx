import React, { useState, useEffect } from 'react'
import api from '../api'

export default function EditVentaModal({ token, venta, onClose, onSaved }){
  const [monto, setMonto] = useState(venta?.monto ?? '')
  const [status, setStatus] = useState(venta?.status ?? 'pendiente')
  const [tipo, setTipo] = useState(venta?.tipo_venta ?? 'recarga')
  const [date, setDate] = useState(venta?.created_at ? new Date(venta.created_at).toISOString().slice(0,10) : new Date().toISOString().slice(0,10))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(()=>{
    setMonto(venta?.monto ?? '')
    setStatus(venta?.status ?? 'pendiente')
    setTipo(venta?.tipo_venta ?? 'recarga')
    function extractDatePart(ts){
      if (!ts) return new Date().toISOString().slice(0,10)
      const m = String(ts).match(/^(\d{4}-\d{2}-\d{2})/)
      if (m) return m[1]
      try { return new Date(ts).toISOString().slice(0,10) } catch(e){ return new Date().toISOString().slice(0,10) }
    }
    setDate(extractDatePart(venta?.created_at))
  }, [venta])

  if (!venta) return null

  async function submit(e){
    e.preventDefault()
    setSaving(true)
    setError(null)
    try{
      if (status !== venta.status){
        await api.updateStatus(venta.id, { status }, token)
      }
      const updates = {}
      if (Number(monto) !== Number(venta.monto)) updates.monto = Number(monto)
      if (tipo !== venta.tipo_venta) updates.tipo_venta = tipo
        // validate date format (YYYY-MM-DD) and timezone hint for Peru
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
      if (Object.keys(updates).length) {
        await api.updateVenta(venta.id, updates, token)
      }
      onSaved && onSaved()
      onClose && onClose()
    }catch(err){
      console.error('update venta error', err)
      setError('Error al actualizar la venta')
    }finally{
      setSaving(false)
    }
  }

  return (
    <div style={{position:'fixed',left:0,top:0,right:0,bottom:0,background:'rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',padding:16,borderRadius:6,minWidth:320}}>
        <h4>Editar Venta #{venta.id}</h4>
        {error && <div style={{color:'red'}}>{error}</div>}
        <form onSubmit={submit}>
          <div style={{marginBottom:8}}>
            <label>Cliente: <strong>{venta.cliente?.nombre || venta.cliente_id}</strong></label>
          </div>
          <div style={{marginBottom:8}}>
            <label>Tipo
              <select value={tipo} onChange={e=>setTipo(e.target.value)}>
                <option value="recarga">Recarga</option>
                <option value="primera">Primera</option>
              </select>
            </label>
          </div>
          <div style={{marginBottom:8}}>
            <label>Status
              <select value={status} onChange={e=>setStatus(e.target.value)}>
                <option value="pendiente">Pendiente</option>
                <option value="entregado">Entregado</option>
                <option value="pagado">Pagado</option>
              </select>
            </label>
          </div>
          <div style={{marginBottom:8}}>
            <label>Monto <input type="number" step="0.01" value={monto} onChange={e=>setMonto(e.target.value)} required/></label>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
            <button type="button" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
