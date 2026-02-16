import React, { useEffect, useState } from 'react'
import api from '../api'

export default function VentaForm({ token }){
  const [clientes, setClientes] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [tipo, setTipo] = useState('recarga')
  const [monto, setMonto] = useState('')
  const [message, setMessage] = useState(null)

  async function load(){
    try{
      const res = await api.getClientes(token)
      setClientes(res.data || res.clientes || res)
    }catch(e){ console.error(e) }
  }

  useEffect(()=>{ load() }, [])

  async function submit(e){
    e.preventDefault()
    try{
      await api.createVenta({ cliente_id: clienteId, tipo_venta: tipo, monto: parseFloat(monto) }, token)
      setMessage('Venta creada')
      setMonto('')
    }catch(err){
      setMessage('Error creando venta')
    }
  }

  return (
    <div style={{marginTop:16}}>
      <h3>Crear Venta</h3>
      {message && <div>{message}</div>}
      <form onSubmit={submit}>
        <label>Cliente
          <select value={clienteId} onChange={e=>setClienteId(e.target.value)} required>
            <option value="">Seleccionar cliente</option>
            {clientes.map(c=> <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </label>
        <label>Tipo
          <select value={tipo} onChange={e=>setTipo(e.target.value)}>
            <option value="recarga">Recarga</option>
            <option value="primera">Primera</option>
          </select>
        </label>
        <label>Monto<input value={monto} onChange={e=>setMonto(e.target.value)} type="number" step="0.01" required/></label>
        <button type="submit">Crear venta</button>
      </form>
    </div>
  )
}
