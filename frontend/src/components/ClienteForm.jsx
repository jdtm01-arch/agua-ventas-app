import React, { useEffect, useState, useRef } from 'react'
import api from '../api'
import ConfirmModal from './ConfirmModal'

export default function ClienteForm({ token }){
  const [clientes, setClientes] = useState([])
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const messageRef = useRef(null)
  const messageTimeoutRef = useRef(null)
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selectedCliente, setSelectedCliente] = useState(null)
  const [editing, setEditing] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [confirmClienteId, setConfirmClienteId] = useState(null)
  const blurTimeoutRef = useRef(null)

  async function load(){
    setLoading(true)
    try{
      const res = await api.getClientes(token)
      // if resource returns { data: [...] }
      setClientes(res.data || res.clientes || res)
    }catch(e){
      console.error(e)
    }
    setLoading(false)
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
      setMessage({ text: 'Cliente creado', type: 'success' })
      setNombre(''); setTelefono(''); setDireccion('')
      setSuggestions([])
      setSearch('')
      await load()
    }catch(err){
      setMessage({ text: 'Error creando cliente', type: 'error' })
    }
  }

  useEffect(()=>{
    if (!message) return
    if (messageRef.current) messageRef.current.focus()
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
    messageTimeoutRef.current = setTimeout(()=> setMessage(null), 5000)
    return ()=>{ if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current) }
  }, [message])

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
      setMessage({ text: 'Cliente actualizado', type: 'success' })
      setSelectedCliente(null)
      setEditing(false)
      setNombre(''); setTelefono(''); setDireccion('')
      await load()
    }catch(err){
      console.error(err)
      setMessage({ text: 'Error actualizando cliente', type: 'error' })
    }
  }

  function cancelEdit(){
    setSelectedCliente(null)
    setEditing(false)
    setNombre(''); setTelefono(''); setDireccion('')
  }

  async function handleDeleteCliente(){
    if (!selectedCliente) return
    const id = selectedCliente.id
    setMessage(null)
    // check if cliente has ventas
    try{
      const res = await api.getVentas(token, { cliente_id: id, per_page: 1 })
      const total = Number(res.meta?.total) || (Array.isArray(res) ? (res.data || res).length : 0)
      if (total > 0) {
        setMessage({ text: 'No se puede eliminar un cliente que tiene ventas asociadas.', type: 'error' })
        return
      }
    }catch(err){
      // If API call fails, fallback to blocking deletion unless confirmed
      console.error('Error checking ventas for cliente', err)
    }
    // open confirm modal
    setConfirmClienteId(id)
    setShowConfirmDelete(true)
  }

  async function confirmDeleteCliente(){
    if (!confirmClienteId) return
    setShowConfirmDelete(false)
    setLoading(true)
    try{
      await api.deleteCliente(confirmClienteId, token)
      setMessage({ text: 'Cliente eliminado', type: 'success' })
      setSelectedCliente(null)
      setEditing(false)
      setNombre(''); setTelefono(''); setDireccion('')
      await load()
    }catch(err){
      console.error(err)
      setMessage({ text: err?.data?.message || 'Error eliminando cliente', type: 'error' })
    }
    setLoading(false)
    setConfirmClienteId(null)
  }

  return (
    <div style={{marginTop:16}}>
      <h2>Clientes</h2>
      {message && (
        <div ref={messageRef} tabIndex={-1} className={message.type === 'error' ? 'message-error' : 'message-success'}>
          {message.text}
        </div>
      )}
      {loading && <div className="loader" role="status" aria-label="Cargando clientes"></div>}
      <form onSubmit={editing ? saveEdit : submit}>
        <label>Nombre<input value={nombre} onChange={e=>setNombre(e.target.value)} required/></label>
        <label>Teléfono<input value={telefono} onChange={e=>setTelefono(e.target.value)} required/></label>
        <label>Dirección<input value={direccion} onChange={e=>setDireccion(e.target.value)} /></label>
        <div className="button-submit-right">
          <button type="submit">{editing ? 'Guardar cambios' : 'Crear cliente'}</button>
          {editing && <button type="button" onClick={cancelEdit}>Cancelar</button>}
          {editing && <button type="button" onClick={handleDeleteCliente} style={{marginLeft:8}} className="btn-danger" aria-label="Eliminar cliente"><i className="fi fi-sr-trash" aria-hidden style={{marginRight:6}}></i>Eliminar cliente</button>}
        </div>
      </form>

      <div style={{marginTop:12}}>
        <h4>Buscar cliente por nombre o teléfono</h4>
        <div style={{position:'relative'}}>
          <input 
            placeholder="Escribe para buscar" 
            value={search} 
            onChange={e=>{ setSearch(e.target.value); setSelectedCliente(null); setEditing(false) }}
            onBlur={()=>{ blurTimeoutRef.current = setTimeout(()=>setSuggestions([]), 200) }}
            onFocus={()=>{ if(blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current) }}
          />
          {suggestions.length>0 && (
            <ul style={{position:'absolute', zIndex:20, background:'#fff', border:'1px solid #ddd', listStyle:'none', padding:6, margin:0, width:'100%', maxHeight:'300px', overflowY:'auto', boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>
              {suggestions.map(s=> (
                <li 
                  key={s.id} 
                  style={{padding:'10px 8px', cursor:'pointer', touchAction:'manipulation', WebkitTapHighlightColor:'rgba(0,0,0,0.1)', borderBottom:'1px solid #eee'}} 
                  onPointerDown={(e)=>{ 
                    e.preventDefault();
                    if(blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                    startEdit(s)
                  }}
                >
                  {s.nombre} {s.telefono?('— '+s.telefono):''}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
        {showConfirmDelete && (
          <ConfirmModal
            open={showConfirmDelete}
            title="Eliminar cliente"
            message={`Confirmar eliminación del cliente ${selectedCliente?.nombre || ''} ?`}
            confirmText="Eliminar"
            cancelText="Cancelar"
            onConfirm={confirmDeleteCliente}
            danger={true}
            onCancel={()=>{ setShowConfirmDelete(false); setConfirmClienteId(null) }}
          />
        )}
    </div>
  )
}
