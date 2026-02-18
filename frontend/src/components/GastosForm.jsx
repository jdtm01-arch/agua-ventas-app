import React, { useEffect, useState, useRef } from 'react'
import api from '../api'

export default function GastosForm({ token, user, onCreated }){
  const [tipos, setTipos] = useState([])
  const [tipo, setTipo] = useState('')
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0,10))
  const [tipoError, setTipoError] = useState('')
  const [montoError, setMontoError] = useState('')
  const [descripcionError, setDescripcionError] = useState('')
  const [dateError, setDateError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const messageRef = useRef(null)
  const messageTimeoutRef = useRef(null)

  useEffect(()=>{
    api.getTiposDeGasto(token).then(r=>{
      const loadedTipos = r.data || r
      setTipos(loadedTipos)
      // Initialize with first tipo (preferably "Combustible" if found)
      const combustible = loadedTipos.find(t => t.nombre && t.nombre.toLowerCase().includes('combustible'))
      if (combustible) setTipo(combustible.id)
      else if (loadedTipos.length > 0) setTipo(loadedTipos[0].id)
    }).catch(()=>setTipos([]))
  }, [])

  async function submit(e){
    e.preventDefault()
    // clear previous errors
    setTipoError(''); setMontoError(''); setDescripcionError(''); setDateError('')
    let hasError = false
    if (!tipo) { setTipoError('Seleccione tipo de gasto'); hasError = true }
    if (!monto || isNaN(monto) || Number(monto) <= 0) { setMontoError('Monto debe ser mayor a cero'); hasError = true }
    if (!date || String(date).trim() === '') { setDateError('Seleccione una fecha'); hasError = true }
    if (!descripcion || String(descripcion).trim() === '') { setDescripcionError('Descripción requerida'); hasError = true }
    if (hasError) return
    setLoading(true)
    try{
      const payloadDate = date ? `${date}T00:00:00-05:00` : undefined
      const payload = { tipo_de_gasto_id: tipo, monto: Number(monto), descripcion: descripcion.trim(), date: payloadDate }
      if (user?.is_admin && user?.id) payload.user_id = user.id
      await api.createGasto(payload, token)
      setTipo(''); setMonto(''); setDescripcion('')
      setMessage({ text: 'Gasto registrado', type: 'success' })
      if (onCreated) onCreated()
    }catch(err){ console.error(err); alert('Error creando gasto') }
    setLoading(false)
  }

  useEffect(()=>{
    if (!message) return
    if (messageRef.current) messageRef.current.focus()
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
    messageTimeoutRef.current = setTimeout(()=> setMessage(null), 5000)
    return ()=>{ if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current) }
  }, [message])

  return (
    <form onSubmit={submit} style={{marginTop:12, padding:12, border:'1px solid #eee', borderRadius:6}}>
      <h2>Registrar gasto</h2>
      {message && (
        <div ref={messageRef} tabIndex={-1} className={message.type === 'error' ? 'message-error' : 'message-success'}>
          {message.text}
        </div>
      )}
      <div className="gasto-row" style={{display:'flex', gap:8, alignItems:'center'}}>
        <label style={{flex:1}}>Tipo
          <select value={tipo} onChange={e=>{ setTipo(e.target.value); if (e.target.value) setTipoError('') }}>
            <option value="">Seleccione tipo</option>
            {tipos.map(t=> <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
          {tipoError && <div className="field-error">{tipoError}</div>}
        </label>
        <label className="gasto-small">Monto (S/)
          <input required type="text" inputMode="decimal" placeholder="Monto (S/)" value={monto} onChange={e=>{
            let v = e.target.value || ''
            // remove any non-digit and non-dot
            v = v.replace(/[^0-9.]/g, '')
            // ensure only one dot
            const parts = v.split('.')
            if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('')
            // limit length
            if (v.length > 15) v = v.slice(0,15)
            setMonto(v)
            const p = parseFloat(v)
            if (v === '' || isNaN(p) || p <= 0) setMontoError('El monto debe ser mayor a cero')
            else setMontoError('')
          }} />
          {montoError && <div className="field-error">{montoError}</div>}
        </label>
        <label className="gasto-small">Fecha
          <input required type="date" value={date} onChange={e=>{ setDate(e.target.value); if (dateError) setDateError('') }} />
          {dateError && <div className="field-error">{dateError}</div>}
        </label>
      </div>
      <div style={{marginTop:8}}>
        <label>Descripción
          <input required placeholder="Descripción" style={{width:'100%'}} value={descripcion} onChange={e=>{ setDescripcion(e.target.value); if (descripcionError) setDescripcionError('') }} />
          {descripcionError && <div className="field-error">{descripcionError}</div>}
        </label>
      </div>
      <div className="button-submit-right">
        <button type="submit" disabled={loading}>{loading? 'Guardando...' : 'Guardar gasto'}</button>
      </div>
    </form>
  )
}
