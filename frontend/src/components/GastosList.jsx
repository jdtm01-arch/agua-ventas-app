import React, { useEffect, useState } from 'react'
import api from '../api'
import ConfirmModal from './ConfirmModal'
import EditGastoModal from './EditGastoModal'
import { LIMITE_EDICION } from '../config'

export default function GastosList({ token, onChanged }){
  const [gastos, setGastos] = useState([])
  const [tipos, setTipos] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editingGasto, setEditingGasto] = useState(null)
  const [editTipo, setEditTipo] = useState('')
  const [editMonto, setEditMonto] = useState('')
  const [editDescripcion, setEditDescripcion] = useState('')
  const [editDate, setEditDate] = useState(new Date().toISOString().slice(0,10))
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [isSmall, setIsSmall] = useState(false)
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
    // detect small screens for card layout
    const mq = window.matchMedia('(max-width:720px)')
    const onMq = e=> setIsSmall(e.matches)
    setIsSmall(mq.matches)
    mq.addEventListener?.('change', onMq)
    if (!mq.addEventListener) mq.addListener(onMq)

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
    // open edit modal with selected gasto
    setEditingGasto(g)
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
      {!loading && gastos.length>0 && (
        <>
        {!isSmall && (
          <div style={{overflowX:'auto'}}>
            <table className="ventas-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Monto (S/)</th>
                  <th>Descripción</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {gastos.map(g=> (
                  <tr key={g.id}>
                    <td>{g.id}</td>
                    <td>{formatDate(g.created_at || g.createdAt)}</td>
                    <td>{g.tipo?.nombre || g.tipo_de_gasto_id}</td>
                    <td>{formatCurrency(g.monto)}</td>
                    <td style={{maxWidth:320}}>{g.descripcion || ''}</td>
                    <td>
                      {(() => {
                        const isAdmin = user?.is_admin || user?.roles?.includes?.('admin') || user?.role === 'admin'
                        const isCreator = user && g.user_id && user.id === g.user_id
                        const createdPart = String(g.created_at || g.createdAt || '').match(/^(\d{4}-\d{2}-\d{2})/)
                        const createdDate = createdPart ? new Date(createdPart[1]) : (g.created_at ? new Date(g.created_at) : null)
                        const ageDays = createdDate ? Math.floor((Date.now() - createdDate.getTime()) / (1000*60*60*24)) : 9999
                        const canEdit = isAdmin || (isCreator && ageDays <= Number(LIMITE_EDICION))
                        const canDelete = isAdmin || (isCreator && ageDays <= Number(LIMITE_EDICION))
                        const isLocked = isCreator && ageDays > Number(LIMITE_EDICION) && !isAdmin
                        if (canEdit) {
                          return (
                            <>
                              <button className="action-btn" onClick={()=>startEdit(g)} aria-label={`Editar gasto ${g.id}`} title="Editar"><i className="fi fi-rr-edit" aria-hidden></i></button>
                              <button className="action-btn danger" onClick={()=>handleDelete(g.id)} aria-label={`Eliminar gasto ${g.id}`} title="Eliminar" style={{marginLeft:6}}><i className="fi fi-sr-trash" aria-hidden></i></button>
                            </>
                          )
                        }
                        return isLocked ? (
                          <span className="badge-locked" title="Bloqueado — no editable" aria-label="Registro bloqueado" style={{display:'inline-flex',alignItems:'center',gap:6}}>
                            <i className="fi fi-ss-lock" aria-hidden></i>
                          </span>
                        ) : (
                          <span className="badge-muted">Sin permiso</span>
                        )
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isSmall && (
          <div className="ventas-cards">
            {gastos.map(g=> (
              <div className="venta-card" key={g.id}>
                <div className="venta-row"><strong>ID:</strong> {g.id}</div>
                <div className="venta-row"><strong>Fecha:</strong> {formatDate(g.created_at || g.createdAt)}</div>
                <div className="venta-row"><strong>Tipo:</strong> {g.tipo?.nombre || g.tipo_de_gasto_id}</div>
                <div className="venta-row"><strong>Monto (S/):</strong> {formatCurrency(g.monto)}</div>
                <div className="venta-row"><strong>Descripción:</strong> {g.descripcion || ''}</div>
                <div className="venta-actions">
                  {(() => {
                    const isAdmin = user?.is_admin || user?.roles?.includes?.('admin') || user?.role === 'admin'
                    const isCreator = user && g.user_id && user.id === g.user_id
                    const createdPart = String(g.created_at || g.createdAt || '').match(/^(\d{4}-\d{2}-\d{2})/)
                    const createdDate = createdPart ? new Date(createdPart[1]) : (g.created_at ? new Date(g.created_at) : null)
                    const ageDays = createdDate ? Math.floor((Date.now() - createdDate.getTime()) / (1000*60*60*24)) : 9999
                    const canEdit = isAdmin || (isCreator && ageDays <= Number(LIMITE_EDICION))
                    const canDelete = isAdmin || (isCreator && ageDays <= Number(LIMITE_EDICION))
                    const isLocked = isCreator && ageDays > Number(LIMITE_EDICION) && !isAdmin
                    if (canEdit) {
                      return (
                        <>
                          <button className="action-btn" onClick={()=>startEdit(g)} aria-label={`Editar gasto ${g.id}`} title="Editar"><i className="fi fi-rr-edit" aria-hidden></i></button>
                          <button className="action-btn danger" onClick={()=>handleDelete(g.id)} aria-label={`Eliminar gasto ${g.id}`} title="Eliminar" style={{marginLeft:8}}><i className="fi fi-sr-trash" aria-hidden></i></button>
                        </>
                      )
                    }
                    return isLocked ? (
                      <span className="action-muted" title={'Bloqueado — no editable por antigüedad'} style={{display:'inline-flex',alignItems:'center',gap:6}}>
                        <i className="fi fi-ss-lock" aria-hidden></i>
                        Editar
                      </span>
                    ) : (
                      <span className="action-muted">Sin permiso</span>
                    )
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
        </>
      )}
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
      {editingGasto && (
        <EditGastoModal
          token={token}
          gasto={editingGasto}
          tipos={tipos}
          onClose={()=> setEditingGasto(null)}
          onSaved={()=>{ load(); setEditingGasto(null); if (onChanged) onChanged() }}
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
