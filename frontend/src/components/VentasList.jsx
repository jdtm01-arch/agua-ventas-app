import React, { useEffect, useState } from 'react'
import api from '../api'
import EditVentaModal from './EditVentaModal'

export default function VentasList({ token }){
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [editing, setEditing] = useState(null)

  async function load(){
    setLoading(true)
    try{
      const [res, me] = await Promise.all([api.getVentas(token, { limit: 50 }), api.getUser(token).catch(()=>null)])
      setVentas(res.data || res.ventas || res)
      if (me) {
        // API returns { user: {...}, is_admin: bool }
        const normalized = me.user ? { ...me.user, is_admin: me.is_admin } : me
        setUser(normalized)
      } else {
        setUser(null)
      }
    }catch(e){ console.error(e) }
    setLoading(false)
  }

  useEffect(()=>{
    load()
    const handler = ()=> load()
    window.addEventListener('ventas-updated', handler)
    return ()=> window.removeEventListener('ventas-updated', handler)
  }, [])

  return (
    <div style={{marginTop:16}}>
      <h3>Ventas</h3>
      {loading && <div>Cargando...</div>}
      {!loading && ventas.length===0 && <div>No hay ventas</div>}
      <ul>
        {ventas.map(v=> {
          const isAdmin = user?.is_admin || user?.roles?.includes?.('admin') || user?.role === 'admin'
          const isCreator = user && v.created_by && user.id === v.created_by
          const canModify = isAdmin || (isCreator && v.status !== 'pagado')

          return (
            <li key={v.id}>
              <strong>#{v.id}</strong> {v.cliente?.nombre || v.cliente_id} — {v.tipo_venta} — {v.monto} — <em>{v.status}</em>
              {canModify ? (
                <>
                  <button style={{marginLeft:8}} onClick={()=>setEditing(v)}>Editar</button>
                  <button style={{marginLeft:8}} onClick={async ()=>{
                    // confirm and re-check permission client-side
                    if (!canModify) { alert('No tienes permiso para eliminar esta venta'); return }
                    const ok = window.confirm('Confirmar eliminación de la venta #' + v.id + ' ?')
                    if (!ok) return
                    try{
                      await api.deleteVenta(v.id, token)
                      load()
                    }catch(e){ console.error(e); alert('Error al eliminar la venta') }
                  }}>Eliminar</button>
                </>
              ) : (
                <span style={{marginLeft:8, padding:'2px 6px', background:'#eee', borderRadius:4, fontSize:12}}>
                  {v.status==='pagado' ? 'Pagado' : 'Sin permiso'}
                </span>
              )}
            </li>
          )
        })}
      </ul>
      {editing && <EditVentaModal token={token} venta={editing} onClose={()=>setEditing(null)} onSaved={()=>load()} />}
    </div>
  )
}
