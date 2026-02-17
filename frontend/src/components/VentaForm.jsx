import React, { useEffect, useState, useRef } from 'react'
import api from '../api'

export default function VentaForm({ token }){
  const [clientes, setClientes] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selectedCliente, setSelectedCliente] = useState(null)
  const blurTimeoutRef = useRef(null)
  const [tipo, setTipo] = useState('recarga')
  const [monto, setMonto] = useState('')
  const [status, setStatus] = useState('pendiente')
  const [date, setDate] = useState(new Date().toISOString().slice(0,10))
  const [message, setMessage] = useState(null)

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
    if (date && !re.test(date)) { setMessage('Formato de fecha inválido. Use YYYY-MM-DD'); return }
    if (!clienteId) { setMessage('Seleccione un cliente de la lista'); return }
    try{
      const isoDate = date ? `${date}T00:00:00-05:00` : undefined
      await api.createVenta({ cliente_id: clienteId, tipo_venta: tipo, monto: parseFloat(monto), status, date: isoDate }, token)
      setMessage('Venta creada')
      setMonto('')
      setDate(new Date().toISOString().slice(0,10))
      window.dispatchEvent(new Event('ventas-updated'))
    }catch(err){
      console.error('createVenta error', err)
      const errMsg = err?.data?.message || err?.data || err?.message || 'Error creando venta'
      setMessage(String(errMsg))
    }
  }

  return (
    <div style={{marginTop:16}}>
      <h3>Crear Venta</h3>
      {message && <div>{message}</div>}
      <form onSubmit={submit}>
        <label>Cliente
          <div style={{position:'relative'}}>
            <input 
              placeholder="Buscar por nombre o teléfono" 
              value={selectedCliente ? (selectedCliente.nombre + ' — ' + (selectedCliente.telefono||'')) : search} 
              onChange={e=>{ setSearch(e.target.value); setSelectedCliente(null); setClienteId('') }}
              onBlur={()=>{ blurTimeoutRef.current = setTimeout(()=>setSuggestions([]), 200) }}
              onFocus={()=>{ if(blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current) }}
            />
            {suggestions.length>0 && !selectedCliente && (
              <ul style={{position:'absolute', zIndex:20, background:'#fff', border:'1px solid #ddd', listStyle:'none', padding:6, margin:0, width:'100%', maxHeight:'300px', overflowY:'auto', boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>
                {suggestions.map(s=> (
                  <li 
                    key={s.id} 
                    style={{padding:'10px 8px', cursor:'pointer', touchAction:'manipulation', WebkitTapHighlightColor:'rgba(0,0,0,0.1)', borderBottom:'1px solid #eee'}} 
                    onPointerDown={(e)=>{ 
                      e.preventDefault();
                      if(blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                      setSelectedCliente(s); 
                      setClienteId(s.id); 
                      setSuggestions([]); 
                      setSearch('')
                    }}
                  >
                    {s.nombre} {s.telefono?('— '+s.telefono):''}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </label>
        <label>Tipo
          <select value={tipo} onChange={e=>setTipo(e.target.value)}>
            <option value="recarga">Recarga</option>
            <option value="primera">Primera</option>
          </select>
        </label>
        <label>Status
          <select value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="pendiente">Pendiente</option>
            <option value="entregado">Entregado</option>
            <option value="pagado">Pagado</option>
          </select>
        </label>
        <label>Monto<input value={monto} onChange={e=>setMonto(e.target.value)} type="number" step="0.01" required/></label>
        <label>Fecha
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
          <div style={{fontSize:12,color:'#666'}}>Zona horaria: America/Lima (GMT-5). Formato: YYYY-MM-DD</div>
        </label>
        <button type="submit">Crear venta</button>
      </form>
    </div>
  )
}
