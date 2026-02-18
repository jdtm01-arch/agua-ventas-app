import React, { useEffect, useState, useRef } from 'react'
import api from '../api'

export default function GastosForm({ token, user, onCreated }){
  const [tipos, setTipos] = useState([])
  const [tipo, setTipo] = useState('')
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0,10))
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const messageRef = useRef(null)
  const messageTimeoutRef = useRef(null)

  useEffect(()=>{
    api.getTiposDeGasto(token).then(r=>setTipos(r.data || r)).catch(()=>setTipos([]))
  }, [])

  async function submit(e){
    e.preventDefault()
    if (!tipo) { alert('Seleccione tipo de gasto'); return }
    if (!monto || isNaN(monto) || Number(monto) <= 0) { alert('Monto inválido'); return }
    if (!descripcion || String(descripcion).trim() === '') { alert('Descripción requerida'); return }
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
      <div style={{display:'flex', gap:8, alignItems:'center'}}>
        <select value={tipo} onChange={e=>setTipo(e.target.value)}>
          <option value="">Seleccione tipo</option>
          {tipos.map(t=> <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </select>
        <input type="number" step="0.1" placeholder="Monto (S/)" value={monto} onChange={e=>setMonto(e.target.value)} />
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
      </div>
      <div style={{marginTop:8}}>
        <input placeholder="Descripción (opcional)" style={{width:'100%'}} value={descripcion} onChange={e=>setDescripcion(e.target.value)} />
      </div>
      <div className="button-submit-right">
        <button type="submit" disabled={loading}>{loading? 'Guardando...' : 'Guardar gasto'}</button>
      </div>
    </form>
  )
}
