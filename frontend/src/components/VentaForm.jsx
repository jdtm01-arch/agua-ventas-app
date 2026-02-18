import React, { useEffect, useState, useRef } from 'react'
import api from '../api'

export default function VentaForm({ token }){
  const [clientes, setClientes] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selectedCliente, setSelectedCliente] = useState(null)
  const [clienteError, setClienteError] = useState(false)
  const blurTimeoutRef = useRef(null)
  const [tipo, setTipo] = useState('recarga')
  const [monto, setMonto] = useState('')
  const [montoError, setMontoError] = useState('')
  const [status, setStatus] = useState('pendiente')
  const [date, setDate] = useState(new Date().toISOString().slice(0,10))
  const [message, setMessage] = useState(null)
  const messageRef = useRef(null)
  const messageTimeoutRef = useRef(null)
  const searchInputRef = useRef(null)

  async function load(){
    try{
      const res = await api.getClientes(token)
      setClientes(res.data || res.clientes || res)
    }catch(e){ console.error(e) }
  }

  useEffect(()=>{ load() }, [])

  useEffect(()=>{
    if (!search) { setSuggestions([]); return }
    const tid = setTimeout(async ()=>{
      try{
        const res = await api.getClientes(token, { q: search })
        const list = res.data || res.clientes || res
        setSuggestions(list)
      }catch(e){ console.error(e); setSuggestions([]) }
    }, 300)
    return ()=> clearTimeout(tid)
  }, [search])

  async function submit(e){
    e.preventDefault()
    // validate date format (YYYY-MM-DD) and timezone hint for Peru
    const re = /^\d{4}-\d{2}-\d{2}$/
    if (date && !re.test(date)) { setMessage({ text: 'Formato de fecha inválido. Use YYYY-MM-DD', type: 'error' }); return }
    if (!clienteId) { setMessage({ text: 'Seleccione un cliente de la lista', type: 'error' }); if (searchInputRef.current) searchInputRef.current.focus(); return }
    // monto validation: numeric and >= 0
    const parsedMonto = parseFloat(monto)
    if (isNaN(parsedMonto) || parsedMonto < 0) { setMessage({ text: 'El monto debe ser un número mayor o igual a 0', type: 'error' }); return }
    try{
      const isoDate = date ? `${date}T00:00:00-05:00` : undefined
      await api.createVenta({ cliente_id: clienteId, tipo_venta: tipo, monto: parsedMonto, status, date: isoDate }, token)
      setMessage({ text: 'Venta creada', type: 'success' })
      // clear form
      setMonto('')
      setDate(new Date().toISOString().slice(0,10))
      setSelectedCliente(null)
      setClienteId('')
      setSearch('')
      setSuggestions([])
      window.dispatchEvent(new Event('ventas-updated'))
    }catch(err){
      console.error('createVenta error', err)
      const errMsg = err?.data?.message || err?.data || err?.message || 'Error creando venta'
      setMessage({ text: String(errMsg), type: 'error' })
    }
  }

  useEffect(()=>{
    if (!message) return
    // focus message for accessibility
    if (messageRef.current) messageRef.current.focus()
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
    messageTimeoutRef.current = setTimeout(()=> setMessage(null), 5000)
    return ()=>{
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
    }
  }, [message])

  return (
    <div style={{marginTop:16}}>
      <h2>Crear Venta</h2>
      {message && (
        <div ref={messageRef} tabIndex={-1} className={message.type === 'error' ? 'message-error' : 'message-success'}>
          {message.text}
        </div>
      )}
      <form onSubmit={submit} className="venta-form">
        <div className="venta-row venta-row-1">
          <div className="venta-field cliente">
            <label>Cliente <span style={{color:'#c53030'}}>*</span></label>
            <div style={{position:'relative'}}>
              <input 
                ref={searchInputRef}
                aria-required={true}
                required
                placeholder="Buscar por nombre o teléfono" 
                value={selectedCliente ? (selectedCliente.nombre + ' — ' + (selectedCliente.telefono||'')) : search} 
                onChange={e=>{ setSearch(e.target.value); setSelectedCliente(null); setClienteId(''); setClienteError(false) }}
                onBlur={()=>{ blurTimeoutRef.current = setTimeout(()=>{ setSuggestions([]); if(!selectedCliente) setClienteError(true) }, 200) }}
                onFocus={()=>{ if(blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current); setClienteError(false) }}
              />
              {suggestions.length>0 && !selectedCliente && (
                <ul className="suggestions-list">
                  {suggestions.map(s=> (
                    <li 
                      key={s.id} 
                      className="suggestion-item"
                      onPointerDown={(e)=>{ 
                        e.preventDefault();
                        if(blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                        setSelectedCliente(s); 
                        setClienteId(s.id); 
                        setSuggestions([]); 
                        setClienteError(false);
                        setSearch('')
                      }}
                    >
                      {s.nombre} {s.telefono?('— '+s.telefono):''}
                    </li>
                  ))}
                </ul>
              )}
              {clienteError && !selectedCliente && (
                <div className="field-error" style={{color:'#c53030', fontSize:12, marginTop:6}}>Seleccione un cliente de la lista</div>
              )}
            </div>
          </div>

          <div className="venta-field tipo">
            <label>Tipo</label>
            <select value={tipo} onChange={e=>setTipo(e.target.value)}>
              <option value="recarga">Recarga</option>
              <option value="primera">Primera</option>
            </select>
          </div>
        </div>

        <div className="venta-row venta-row-2">
          <div className="venta-field status">
            <label>Status</label>
            <select value={status} onChange={e=>setStatus(e.target.value)}>
              <option value="pendiente">Pendiente</option>
              <option value="entregado">Entregado</option>
              <option value="pagado">Pagado</option>
            </select>
          </div>

          <div className="venta-field monto">
            <label>Monto (S/)</label>
            <input
              value={monto}
              onChange={e=>{
                let v = e.target.value || ''
                // remove any non-digit and non-dot and non-leading minus, then remove minus to avoid negatives
                v = v.replace(/[^0-9.]/g, '')
                // ensure only one dot
                const parts = v.split('.')
                if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('')
                // limit length
                if (v.length > 15) v = v.slice(0,15)
                setMonto(v)
                const p = parseFloat(v)
                if (v === '' || isNaN(p) || p < 0) setMontoError('El monto debe ser un número mayor o igual a 0')
                else setMontoError('')
              }}
              type="number"
              step="0.1"
              min="0"
              placeholder="Monto (S/)"
              required
            />
            {montoError && <div className="field-error">{montoError}</div>}
          </div>

          <div className="venta-field fecha">
            <label>Fecha</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
            <div style={{fontSize:12,color:'#666'}}>Zona horaria: America/Lima (GMT-5)</div>
          </div>
        </div>

        <div className="button-submit-right">
          <button
            type="submit"
            aria-disabled={!clienteId}
            className={!clienteId ? 'btn-disabled' : ''}
          >Crear venta</button>
        </div>
      </form>
    </div>
  )
}
