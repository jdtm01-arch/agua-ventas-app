import React, { useEffect, useState } from 'react'
import api from '../api'

export default function GastosList({ token, onChanged }){
  const [gastos, setGastos] = useState([])
  const [tipos, setTipos] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editTipo, setEditTipo] = useState('')
  const [editMonto, setEditMonto] = useState('')
  const [editDescripcion, setEditDescripcion] = useState('')
  const [editDate, setEditDate] = useState(new Date().toISOString().slice(0,10))
  const [loading, setLoading] = useState(false)

  async function load(){
    try{
      const res = await api.getGastos(token, { limit: 50 })
      setGastos(res.data || res)
    }catch(e){ console.error(e) }
  }

  useEffect(()=>{
    load()
    api.getTiposDeGasto(token).then(r=>setTipos(r.data || r)).catch(()=>setTipos([]))
  }, [])

  useEffect(()=>{
    function handler(){ load() }
    window.addEventListener('gastos-updated', handler)
    return ()=> window.removeEventListener('gastos-updated', handler)
  }, [])

  function startEdit(g){
    setEditingId(g.id)
    setEditTipo(g.tipo_de_gasto_id)
    setEditMonto(String(g.monto))
    setEditDescripcion(g.descripcion || '')
    // extract YYYY-MM-DD safely to avoid timezone shift when rendering
    const m = String(g.created_at).match(/^(\d{4}-\d{2}-\d{2})/)
    setEditDate(m ? m[1] : (new Date(g.created_at)).toISOString().slice(0,10))
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
    if (!window.confirm('¿Eliminar gasto? Esta acción no se puede deshacer.')) return
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
      <h4>Gastos</h4>
      {gastos.length===0 && <div>No hay gastos</div>}
      <ul>
        {gastos.map(g => (
          <li key={g.id} style={{marginBottom:6}}>
            {editingId === g.id ? (
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <select value={editTipo} onChange={e=>setEditTipo(e.target.value)}>
                  <option value="">Seleccione tipo</option>
                  {tipos.map(t=> <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
                <input style={{width:100}} value={editMonto} onChange={e=>setEditMonto(e.target.value)} />
                <input type="date" value={editDate} onChange={e=>setEditDate(e.target.value)} />
                <input placeholder="Descripción" value={editDescripcion} onChange={e=>setEditDescripcion(e.target.value)} />
                <button onClick={()=>saveEdit(g.id)} disabled={loading}>{loading? 'Guardando...' : 'Guardar'}</button>
                <button onClick={cancelEdit} disabled={loading}>Cancelar</button>
              </div>
            ) : (
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <div style={{flex:1}}>{g.tipo?.nombre || g.tipo_de_gasto_id} — ${g.monto} — {formatDate(g.created_at)}</div>
                <div>
                  <button onClick={()=>startEdit(g)}>Editar</button>
                  <button onClick={()=>handleDelete(g.id)} style={{marginLeft:6}}>Eliminar</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function formatDate(iso){
  if (!iso) return ''
  const m = String(iso).match(/^(\d{4}-\d{2}-\d{2})/)
  if (m){ const [y,mo,d] = m[1].split('-'); return `${d}/${mo}/${y}` }
  try { return new Date(iso).toLocaleDateString() } catch(e){ return iso }
}
