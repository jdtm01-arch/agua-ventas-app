import React, { useEffect, useState } from 'react'
import api from '../api'

export default function ClienteForm({ token }){
  const [clientes, setClientes] = useState([])
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [message, setMessage] = useState(null)

  async function load(){
    try{
      const res = await api.getClientes(token)
      // if resource returns { data: [...] }
      setClientes(res.data || res.clientes || res)
    }catch(e){
      console.error(e)
    }
  }

  useEffect(()=>{ load() }, [])

  async function submit(e){
    e.preventDefault()
    try{
      const res = await api.createCliente({ nombre, telefono, direccion }, token)
      setMessage('Cliente creado')
      setNombre(''); setTelefono(''); setDireccion('')
      await load()
    }catch(err){
      setMessage('Error creando cliente')
    }
  }

  return (
    <div style={{marginTop:16}}>
      <h3>Clientes</h3>
      {message && <div>{message}</div>}
      <form onSubmit={submit}>
        <label>Nombre<input value={nombre} onChange={e=>setNombre(e.target.value)} required/></label>
        <label>Teléfono<input value={telefono} onChange={e=>setTelefono(e.target.value)} required/></label>
        <label>Dirección<input value={direccion} onChange={e=>setDireccion(e.target.value)} /></label>
        <button type="submit">Crear cliente</button>
      </form>

      <div style={{marginTop:12}}>
        <h4>Lista de clientes</h4>
        <ul>
          {clientes && clientes.length ? clientes.map(c=> <li key={c.id}>{c.nombre} — {c.telefono}</li>) : <li>No hay clientes</li>}
        </ul>
      </div>
    </div>
  )
}
