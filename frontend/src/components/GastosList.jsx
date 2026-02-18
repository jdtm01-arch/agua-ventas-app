import React, { useEffect, useState } from 'react'
import api from '../api'
import ConfirmModal from './ConfirmModal'
import { LIMITE_EDICION } from '../config'

export default function GastosList({ token, onChanged }){
  const [gastos, setGastos] = useState([])
  const [tipos, setTipos] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editTipo, setEditTipo] = useState('')
  const [editMonto, setEditMonto] = useState('')
  const [editDescripcion, setEditDescripcion] = useState('')
  const [editDate, setEditDate] = useState(new Date().toISOString().slice(0,10))
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [confirmGastoId, setConfirmGastoId] = useState(null)
  const [showConfirmGasto, setShowConfirmGasto] = useState(false)

  async function load(){
    setLoading(true)
    try{
      const res = await api.getGastos(token, { limit: 50 })
      setGastos(res.data || res)
    }catch(e){ console.error(e) }
    setLoading(false)
  }

  useEffect(()=>{
    load()
    api.getTiposDeGasto(token).then(r=>setTipos(r.data || r)).catch(()=>setTipos([]))
    // fetch current user to evaluate permissions
    api.getUser(token).then(r=>{ const u = r.user || r; if (r.is_admin) u.is_admin = true; setUser(u) }).catch(()=>setUser(null))
  }, [])

  useEffect(()=>{
    function handler(){ load() }
    window.addEventListener('gastos-updated', handler)
    return ()=> window.removeEventListener('gastos-updated', handler)
  }, [])

  function startEdit(g){
    const isAdmin = user?.is_admin || user?.roles?.includes?.('admin') || user?.role === 'admin'
    const isCreator = user && g.user_id && user.id === g.user_id
    const createdPart = String(g.created_at || g.createdAt || '').match(/^(\d{4}-\d{2}-\d{2})/)
    const createdDate = createdPart ? new Date(createdPart[1]) : (g.created_at ? new Date(g.created_at) : null)
    const ageDays = createdDate ? Math.floor((Date.now() - createdDate.getTime()) / (1000*60*60*24)) : 9999
    const canEdit = isAdmin || (isCreator && ageDays <= Number(LIMITE_EDICION))
    if (!canEdit) { alert('No puedes editar este gasto. Solo administradores o el creador dentro de ' + LIMITE_EDICION + ' días pueden editarlo.'); return }
    setEditingId(g.id)
    setEditTipo(g.tipo_de_gasto_id)
    setEditMonto(String(g.monto))
    setEditDescripcion(g.descripcion || '')
    // extract YYYY-MM-DD safely to avoid timezone shift when rendering
    const m = String(g.created_at).match(/^(\d{4}-\d{2}-\d{2})/)
    setEditDate(m ? m[1] : (new Date(g.created_at)).toISOString().slice(0,10))
  }

  function canEditGasto(g){
    const isAdmin = user?.is_admin || user?.roles?.includes?.('admin') || user?.role === 'admin'
    const isCreator = user && g.user_id && user.id === g.user_id
    const createdPart = String(g.created_at || g.createdAt || '').match(/^(\d{4}-\d{2}-\d{2})/)
    const createdDate = createdPart ? new Date(createdPart[1]) : (g.created_at ? new Date(g.created_at) : null)
    const ageDays = createdDate ? Math.floor((Date.now() - createdDate.getTime()) / (1000*60*60*24)) : 9999
    return isAdmin || (isCreator && ageDays <= Number(LIMITE_EDICION))
  }

  function cancelEdit(){
    setEditingId(null)
  }

  async function saveEdit(id){
    if (!editTipo) { alert('Seleccione tipo'); return }
    if (!editMonto || isNaN(editMonto) || Number(editMonto) <= 0) { alert('Monto inválido'); return }
    if (!editDescripcion || String(editDescripcion).trim() === '') { alert('Descripción requerida'); return }
    setLoading(true)
    try{
      const payloadDate = editDate ? `${editDate}T00:00:00-05:00` : undefined
      const payload = { tipo_de_gasto_id: editTipo, monto: Number(editMonto), descripcion: editDescripcion.trim(), date: payloadDate }
      await api.updateGasto(id, payload, token)
      await load()
      setEditingId(null)
      if (onChanged) onChanged()
    }catch(err){ console.error(err); alert('Error actualizando gasto') }
    setLoading(false)
  }

  async function handleDelete(id){
    const g = gastos.find(x=>x.id===id)
    if (!g) return
    const isAdmin = user?.is_admin || user?.roles?.includes?.('admin') || user?.role === 'admin'
    const isCreator = user && g.user_id && user.id === g.user_id
    const createdPart = String(g.created_at || g.createdAt || '').match(/^(\d{4}-\d{2}-\d{2})/)
    const createdDate = createdPart ? new Date(createdPart[1]) : (g.created_at ? new Date(g.created_at) : null)
    const ageDays = createdDate ? Math.floor((Date.now() - createdDate.getTime()) / (1000*60*60*24)) : 9999
    const canDelete = isAdmin || (isCreator && ageDays <= Number(LIMITE_EDICION))
    if (!canDelete) { alert('No puedes eliminar este gasto. Solo administradores o el vendedor dentro de ' + LIMITE_EDICION + ' días pueden eliminarlo.'); return }
    // show confirm modal instead
    setConfirmGastoId(id)
    setShowConfirmGasto(true)
  }

  async function confirmDeleteGasto(id){
    setShowConfirmGasto(false)
    setLoading(true)
    try{
      await api.deleteGasto(id, true, token)
      await load()
      if (onChanged) onChanged()
    }catch(err){ console.error(err); alert('Error eliminando gasto') }
    setLoading(false)
  }

  return (
    <div style={{marginTop:12}}>
      <h2>Gastos</h2>
      {loading && <div className="loader" role="status" aria-label="Cargando gastos"></div>}
      {(!loading && gastos.length===0) && <div>No hay gastos</div>}
      <ul>
        {gastos.map(g => (
          <li key={g.id} style={{marginBottom:6}}>
              {editingId === g.id ? (
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <select value={editTipo} onChange={e=>setEditTipo(e.target.value)}>
                  <option value="">Seleccione tipo</option>
                  {tipos.map(t=> <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
                <input style={{width:100}} type="number" step="0.1" value={editMonto} onChange={e=>setEditMonto(e.target.value)} />
                <input type="date" value={editDate} onChange={e=>setEditDate(e.target.value)} />
                <input placeholder="Descripción" value={editDescripcion} onChange={e=>setEditDescripcion(e.target.value)} />
                <button onClick={()=>saveEdit(g.id)} disabled={loading}>{loading? 'Guardando...' : 'Guardar'}</button>
                <button onClick={cancelEdit} disabled={loading}>Cancelar</button>
              </div>
            ) : (
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <div style={{flex:1}}>{g.tipo?.nombre || g.tipo_de_gasto_id} — {formatCurrency(g.monto)} — {formatDate(g.created_at)}</div>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  {canEditGasto(g) ? <button className="action-btn" onClick={()=>startEdit(g)} aria-label={`Editar gasto ${g.id}`}><i className="fi fi-rr-edit" aria-hidden></i></button> : <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'6px 8px',color:'#999',fontSize:13}} title='Antiguo — no editable'><i className="fi fi-rr-edit" style={{marginRight:6,opacity:0.35}} aria-hidden></i>Editar</span>}
                  {canEditGasto(g) ? <button className="action-btn danger" onClick={()=>handleDelete(g.id)} aria-label={`Eliminar gasto ${g.id}`}><i className="fi fi-sr-trash" aria-hidden></i></button> : <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'6px 8px',color:'#999',fontSize:13}} title='Antiguo — no eliminable'><i className="fi fi-sr-trash" style={{marginRight:6,opacity:0.35}} aria-hidden></i>Eliminar</span>}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {showConfirmGasto && (
        <ConfirmModal
          open={showConfirmGasto}
          title="Eliminar gasto"
          message={`¿Eliminar gasto #${confirmGastoId}? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          danger={true}
          onConfirm={()=> confirmDeleteGasto(confirmGastoId)}
          onCancel={()=>{ setShowConfirmGasto(false); setConfirmGastoId(null) }}
        />
      )}
    </div>
  )
}

function formatDate(iso){
  if (!iso) return ''
  const m = String(iso).match(/^(\d{4}-\d{2}-\d{2})/)
  if (m){ const [y,mo,d] = m[1].split('-'); return `${d}/${mo}/${y}` }
  try { return new Date(iso).toLocaleDateString() } catch(e){ return iso }
}

function formatCurrency(v){
  const n = Number(v) || 0
  try{
    return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 })
  }catch(e){
    return `S/ ${n.toFixed(2)}`
  }
}
