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
  const [isAdmin, setIsAdmin] = useState(false)
  const messageRef = useRef(null)
  const messageTimeoutRef = useRef(null)
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selectedCliente, setSelectedCliente] = useState(null)
  const [selectedHasVentas, setSelectedHasVentas] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showCreateConfirm, setShowCreateConfirm] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [confirmClienteId, setConfirmClienteId] = useState(null)
  const [nameError, setNameError] = useState('')
  const [telefonoError, setTelefonoError] = useState('')
  const [direccionError, setDireccionError] = useState('')
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

  // detect current user role to know if delete should be visible
  useEffect(()=>{
    if (!token) return
    let mounted = true
    api.getUser(token).then(u=>{
      if (!mounted) return
      const isAdminFlag = (u && (u.is_admin === true || u.role === 'admin' || (Array.isArray(u.roles) && u.roles.includes('admin'))))
      setIsAdmin(Boolean(isAdminFlag))
    }).catch(()=>{})
    return ()=>{ mounted = false }
  }, [token])

  // When creating a new cliente, show confirmation first
  async function submit(e){
    e.preventDefault()
    if (editing) return saveEdit(e)
    // require nombre
    if (!nombre || !String(nombre).trim()) {
      setNameError('El nombre es obligatorio')
      return
    }
    if (nombre.trim().length > 50) {
      setNameError('El nombre no puede exceder 50 caracteres')
      return
    }
    // telefono validation (optional)
    if (telefono && !/^\+?\d{1,14}$/.test(telefono)){
      setTelefonoError('Teléfono inválido (solo números y +, máximo 14 caracteres)')
      return
    }
    // direccion length
    if (direccion && direccion.length > 100){
      setDireccionError('Dirección no puede exceder 100 caracteres')
      return
    }
    // clear errors and show confirm
    setNameError('')
    setTelefonoError('')
    setDireccionError('')
    setShowCreateConfirm(true)
  }

  async function handleConfirmCreate(){
    setShowCreateConfirm(false)
    setLoading(true)
    try{
      const res = await api.createCliente({ nombre, telefono, direccion }, token)
      setMessage({ text: 'Cliente creado', type: 'success' })
      setNombre(''); setTelefono(''); setDireccion('')
      setSuggestions([])
      setSearch('')
      await load()
    }catch(err){
      console.error(err)
      setMessage({ text: 'Error creando cliente', type: 'error' })
    }
    setLoading(false)
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
    setSelectedHasVentas(false)
    // check if cliente has ventas; disable delete if so
    try{
      const res = await api.getVentas(token, { cliente_id: c.id, per_page: 1 })
      const total = Number(res.meta?.total) || (Array.isArray(res) ? (res.data || res).length : 0)
      setSelectedHasVentas(total > 0)
    }catch(e){ console.error('error checking ventas for selected cliente', e); setSelectedHasVentas(false) }
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
      setSelectedHasVentas(false)
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
    setSelectedHasVentas(false)
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
      setSelectedHasVentas(false)
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
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12}}>
        <h2 style={{margin:'0 0 12px 0'}}>Clientes</h2>
        <div className="cliente-search" style={{width:320, maxWidth:'40%', position:'relative'}}>
          <input
            className="cliente-search-input"
            placeholder={"🔍 Buscar cliente por nombre o teléfono"}
            value={search}
            onChange={e=>{ setSearch(e.target.value); setSelectedCliente(null); setEditing(false) }}
            onBlur={()=>{ blurTimeoutRef.current = setTimeout(()=>setSuggestions([]), 200) }}
            onFocus={()=>{ if(blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current) }}
            style={{width:'100%'}}
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
      {message && (
        <div ref={messageRef} tabIndex={-1} className={message.type === 'error' ? 'message-error' : 'message-success'}>
          {message.text}
        </div>
      )}
      {loading && <div className="loader" role="status" aria-label="Cargando clientes"></div>}
      <form onSubmit={editing ? saveEdit : submit}>
            <div className="cliente-row" style={{display:'flex', gap:12, alignItems:'flex-start', flexWrap:'wrap'}}>
          <label style={{flex:1, minWidth:200}}>Nombre
            <input
              placeholder="Nombre"
              value={nombre}
              onChange={e=>{
                const v = e.target.value
                if (v.length <= 50){ setNombre(v); setNameError('') } else { setNombre(v.slice(0,50)); setNameError('El nombre no puede exceder 50 caracteres') }
              }}
              required
              maxLength={50}
            />
            {nameError && <div style={{color:'#c53030',fontSize:13,marginTop:6}}>{nameError}</div>}
          </label>
          <label style={{flex:1, minWidth:200}}>Teléfono
            <input
              type="tel"
              placeholder="Teléfono"
              value={telefono}
              onChange={e=>{
                // allow only digits and leading +, max 14 chars
                let v = e.target.value || ''
                // remove all non-digit and non-plus
                v = v.replace(/[^\d+]/g, '')
                // keep only first plus if present and at start
                const hasPlus = v.indexOf('+') !== -1
                v = v.replace(/\+/g, '')
                if (hasPlus && e.target.value[0] === '+') v = '+' + v
                v = v.slice(0,14)
                setTelefono(v)
                if (v && !/^\+?\d{1,14}$/.test(v)) setTelefonoError('Teléfono inválido (solo números y +)')
                else setTelefonoError('')
              }}
              maxLength={14}
            />
            {telefonoError && <div style={{color:'#c53030',fontSize:13,marginTop:6}}>{telefonoError}</div>}
          </label>
        </div>
        <label>Dirección
          <input
            placeholder="Dirección"
            value={direccion}
            onChange={e=>{
              const v = e.target.value
              if (v.length <= 100){ setDireccion(v); setDireccionError('') } else { setDireccion(v.slice(0,100)); setDireccionError('Dirección no puede exceder 100 caracteres') }
            }}
            maxLength={100}
          />
          {direccionError && <div style={{color:'#c53030',fontSize:13,marginTop:6}}>{direccionError}</div>}
        </label>
        <div className="button-submit-right">
          <button type="submit">{editing ? 'Guardar cambios' : 'Crear cliente'}</button>
          {editing && <button type="button" onClick={cancelEdit}>Cancelar</button>}
          {editing && isAdmin && (
            <button
              type="button"
              onClick={handleDeleteCliente}
              style={{marginLeft:8}}
              className="btn-danger"
              aria-label="Eliminar cliente"
              disabled={selectedHasVentas}
              title={selectedHasVentas ? 'No se puede eliminar: el cliente tiene ventas asociadas' : 'Eliminar cliente'}
            >
              <i className="fi fi-sr-trash" aria-hidden style={{marginRight:6}}></i>Eliminar cliente
            </button>
          )}
        </div>
      </form>

      
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
          {showCreateConfirm && (
            <ConfirmModal
              open={showCreateConfirm}
              title="Confirmar creación"
              message={`Crear cliente ${nombre}${telefono?(' — '+telefono):''}${direccion?(' — '+direccion):''} ?`}
              confirmText="Crear"
              cancelText="Cancelar"
              onConfirm={handleConfirmCreate}
              onCancel={()=>{ setShowCreateConfirm(false) }}
            />
          )}
    </div>
  )
}
