import React, { useEffect, useState } from 'react'
import api from '../api'

export default function ClienteForm({ token }){
  const [clientes, setClientes] = useState([])
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [message, setMessage] = useState(null)
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selectedCliente, setSelectedCliente] = useState(null)
  const [editing, setEditing] = useState(false)

  async function load(){
    try{
      const res = await api.getClientes(token)
      // if resource returns { data: [...] }
      setClientes(res.data || res.clientes || res)
    }catch(e){
      console.error(e)
    }
  }

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

  async function startEdit(c){
    setSelectedCliente(c)
    setNombre(c.nombre || '')
    setTelefono(c.telefono || '')
    setDireccion(c.direccion || '')
    setEditing(true)
    setSuggestions([])
    setSearch('')
  }

  async function saveEdit(e){
    e.preventDefault()
    if (!selectedCliente) return
    try{
      await api.updateCliente(selectedCliente.id, { nombre, telefono, direccion }, token)
      setMessage('Cliente actualizado')
      setSelectedCliente(null)
      setEditing(false)
      setNombre(''); setTelefono(''); setDireccion('')
      await load()
    }catch(err){
      console.error(err)
      setMessage('Error actualizando cliente')
    }
  }

  function cancelEdit(){
    setSelectedCliente(null)
    setEditing(false)
    setNombre(''); setTelefono(''); setDireccion('')
  }

  return (
    <div style={{marginTop:16}}>
      <h3>Clientes</h3>
      {message && <div>{message}</div>}
      <form onSubmit={editing ? saveEdit : submit}>
        <label>Nombre<input value={nombre} onChange={e=>setNombre(e.target.value)} required/></label>
        <label>Teléfono<input value={telefono} onChange={e=>setTelefono(e.target.value)} required/></label>
        <label>Dirección<input value={direccion} onChange={e=>setDireccion(e.target.value)} /></label>
        <button type="submit">{editing ? 'Guardar cambios' : 'Crear cliente'}</button>
        {editing && <button type="button" onClick={cancelEdit} style={{marginLeft:8}}>Cancelar</button>}
      </form>

      <div style={{marginTop:12}}>
        <h4>Buscar cliente por nombre o teléfono</h4>
        <div style={{position:'relative'}}>
          <input placeholder="Escribe para buscar" value={search} onChange={e=>{ setSearch(e.target.value); setSelectedCliente(null); setEditing(false) }} />
          {suggestions.length>0 && (
            <ul style={{position:'absolute', zIndex:20, background:'#fff', border:'1px solid #ddd', listStyle:'none', padding:6, margin:0, width:'100%'}}>
              {suggestions.map(s=> (
                <li key={s.id} style={{padding:'6px 8px', cursor:'pointer'}} onClick={()=>startEdit(s)}>{s.nombre} {s.telefono?('— '+s.telefono):''}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
