import React, { useEffect, useState } from 'react'
import api from '../api'
import EditVentaModal from './EditVentaModal'
import ConfirmModal from './ConfirmModal'
import { LIMITE_EDICION, PAGINACION } from '../config'

export default function VentasList({ token }){
  const [ventas, setVentas] = useState([])
  const [totalVentas, setTotalVentas] = useState(0)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [editing, setEditing] = useState(null)
  const [isSmall, setIsSmall] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const perPage = Number(PAGINACION) || 20
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  async function load(p = 1){
    setLoading(true)
    try{
      const params = { per_page: perPage, page: p }
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter
      const [res, me] = await Promise.all([api.getVentas(token, params), api.getUser(token).catch(()=>null)])
      // Laravel paginate response: {data: [...], meta: {current_page, last_page, total, ...}}
      // or simple array response: {data: [...]} or just [...]
      let items = res.data || res.ventas || res || []
      // ensure list is ordered from most recent to oldest by created_at
      items = items.slice().sort((a,b)=>{
        const da = new Date(a.created_at || a.createdAt || null)
        const db = new Date(b.created_at || b.createdAt || null)
        if (isNaN(da)) return 1
        if (isNaN(db)) return -1
        return db.getTime() - da.getTime()
      })
      const meta = res.meta || {}
      const lastPage = Number(meta.last_page) || 1
      const currentPage = Number(meta.current_page) || p

      // total number of records (Laravel paginate provides meta.total)
      const total = Number(meta.total) || (Array.isArray(res) ? items.length : 0)

      setVentas(items)
      setTotalVentas(total)
      setHasNext(currentPage < lastPage)
      
      if (me) {
        const normalized = me.user ? { ...me.user, is_admin: me.is_admin } : me
        setUser(normalized)
      } else {
        setUser(null)
      }
    }catch(e){ console.error(e) }
    setLoading(false)
  }

  function formatCurrency(v){
    const n = Number(v) || 0
    try{ return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }) }
    catch(e){ return `S/ ${n.toFixed(2)}` }
  }

  useEffect(()=>{
    // detect small screens for card layout
    const mq = window.matchMedia('(max-width:720px)')
    const onMq = e=> setIsSmall(e.matches)
    setIsSmall(mq.matches)
    mq.addEventListener?.('change', onMq)
    if (!mq.addEventListener) mq.addListener(onMq)

    const handler = ()=> load(page)
    window.addEventListener('ventas-updated', handler)
    // initial load
    load(page)

    return ()=>{
      window.removeEventListener('ventas-updated', handler)
      mq.removeEventListener?.('change', onMq)
      if (!mq.removeEventListener) mq.removeListener(onMq)
    }
  }, [])

  // reload when page changes
  useEffect(()=>{ load(page) }, [page])

  // when status filter changes, reset to first page and load
  useEffect(()=>{
    if (page !== 1) setPage(1)
    else load(1)
  }, [statusFilter])

  return (
    <div style={{marginTop:16}}>
      <div className="ventas-header">
        <div style={{display:'flex',alignItems:'baseline',gap:12}}>
          <h2 style={{margin:0}}>Ventas</h2>
          <div style={{fontSize:13,color:'#666'}}>Mostrando {ventas.length} de {totalVentas}</div>
        </div>
        <div className="ventas-filter">
          <label htmlFor="filtro-status">Filtrar:</label>
          <select id="filtro-status" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="entregado">Entregado</option>
            <option value="pagado">Pagado</option>
          </select>
        </div>
      </div>
      {loading && <div className="loader" role="status" aria-label="Cargando"></div>}
      {!loading && ventas.length===0 && <div>No hay ventas</div>}
      {!loading && ventas.length>0 && (
        <> 
        {!isSmall && (
          <div style={{overflowX:'auto'}}>
            <table className="ventas-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Monto (S/)</th>
                <th>Status</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map(v=>{
                const isAdmin = user?.is_admin || user?.roles?.includes?.('admin') || user?.role === 'admin'
                const isCreator = user && v.created_by && user.id === v.created_by
                const createdPart = String(v.created_at || v.createdAt || '').match(/^(\d{4}-\d{2}-\d{2})/)
                const createdDate = createdPart ? new Date(createdPart[1]) : (v.created_at ? new Date(v.created_at) : null)
                const ageDays = createdDate ? Math.floor((Date.now() - createdDate.getTime()) / (1000*60*60*24)) : 9999
                // can modify/delete if:
                // - admin, OR
                // - creator AND (status not pagado OR age within LIMITE_EDICION)
                const canModify = isAdmin || (isCreator && (v.status !== 'pagado' || ageDays <= Number(LIMITE_EDICION)))
                const canDelete = isAdmin || (isCreator && (v.status !== 'pagado' || ageDays <= Number(LIMITE_EDICION)))
                const isLocked = isCreator && v.status === 'pagado' && ageDays > Number(LIMITE_EDICION)

                function formatDateDMY(iso){
                  if (!iso) return ''
                  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/)
                  if (m) return `${m[3]}/${m[2]}/${m[1]}`
                  try{ const d = new Date(iso); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}` }catch(e){ return iso }
                }

                const tipoText = String(v.tipo_venta || '').toUpperCase()
                const statusText = String(v.status || '').toUpperCase()
                const statusClass = `status-${String(v.status||'').toLowerCase()}`

                return (
                  <tr key={v.id}>
                    <td>{v.id}</td>
                    <td>{v.cliente?.nombre || v.cliente_id}</td>
                    <td>{formatDateDMY(v.created_at || v.createdAt)}</td>
                    <td>{tipoText}</td>
                    <td>{formatCurrency(v.monto)}</td>
                    <td><span className={`status-badge ${statusClass}`}>{statusText}</span></td>
                    <td>
                      {canModify && (
                        <button className="action-btn" onClick={()=>setEditing(v)} aria-label={`Editar venta ${v.id}`} title="Editar">
                          <i className="fi fi-rr-edit" aria-hidden></i>
                        </button>
                      )}
                      {canDelete ? (
                        <button className="action-btn danger" onClick={()=>{ setConfirmDeleteId(v.id); setShowConfirmDelete(true) }} aria-label={`Eliminar venta ${v.id}`} title="Eliminar">
                          <i className="fi fi-sr-trash" aria-hidden></i>
                        </button>
                      ) : (
                        v.status==='pagado' ? (
                          <span className="badge-locked" title="Pagado — no editable" aria-label="No editable, venta pagada" style={{marginLeft:8,display:'inline-flex',alignItems:'center',gap:6}}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                              <path d="M17 8V7a5 5 0 0 0-10 0v1" stroke="#1f7a34" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                              <rect x="4" y="8" width="16" height="12" rx="2" stroke="#1f7a34" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 13v3" stroke="#1f7a34" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        ) : (
                          <span className="badge-muted" style={{marginLeft:8}}>{'Sin permiso'}</span>
                        )
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        )}

        {isSmall && (
          <div className="ventas-cards">
            {ventas.map(v=>{
              const isAdmin = user?.is_admin || user?.roles?.includes?.('admin') || user?.role === 'admin'
              const isCreator = user && v.created_by && user.id === v.created_by
              const createdPart = String(v.created_at || v.createdAt || '').match(/^(\d{4}-\d{2}-\d{2})/)
              const createdDate = createdPart ? new Date(createdPart[1]) : (v.created_at ? new Date(v.created_at) : null)
              const ageDays = createdDate ? Math.floor((Date.now() - createdDate.getTime()) / (1000*60*60*24)) : 9999
              const canModify = isAdmin || (isCreator && (v.status !== 'pagado' || ageDays <= Number(LIMITE_EDICION)))
              const canDelete = isAdmin || (isCreator && (v.status !== 'pagado' || ageDays <= Number(LIMITE_EDICION)))
              const isLocked = isCreator && v.status === 'pagado' && ageDays > Number(LIMITE_EDICION)

              function formatDateDMY(iso){
                if (!iso) return ''
                const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/)
                if (m) return `${m[3]}/${m[2]}/${m[1]}`
                try{ const d = new Date(iso); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}` }catch(e){ return iso }
              }

              const tipoText = String(v.tipo_venta || '').toUpperCase()
              const statusText = String(v.status || '').toUpperCase()
              const statusClass = `status-${String(v.status||'').toLowerCase()}`

              return (
                <div className="venta-card" key={v.id}>
                  <div className="venta-row"><strong>ID:</strong> {v.id}</div>
                  <div className="venta-row"><strong>Cliente:</strong> {v.cliente?.nombre || v.cliente_id}</div>
                  <div className="venta-row"><strong>Fecha:</strong> {formatDateDMY(v.created_at || v.createdAt)}</div>
                  <div className="venta-row"><strong>Tipo:</strong> {tipoText}</div>
                  <div className="venta-row"><strong>Monto (S/):</strong> {formatCurrency(v.monto)}</div>
                  <div className="venta-row"><strong>Status:</strong> <span className={`status-badge ${statusClass}`}>{statusText}</span></div>
                  <div className="venta-actions">
                    {canModify ? (
                      <button className="action-btn" onClick={()=>setEditing(v)} aria-label={`Editar venta ${v.id}`} title="Editar">
                        <i className="fi fi-rr-edit" aria-hidden></i>
                      </button>
                    ) : (
                      <span className="action-muted" title={isLocked ? 'Pagado — no editable por antigüedad' : undefined}>
                        <i className="fi fi-rr-edit" style={{opacity:0.35,marginRight:6}} aria-hidden></i>
                        Editar
                      </span>
                    )}
                    <span className="action-sep">|</span>
                    {canDelete ? (
                      <button className="action-btn danger" onClick={()=>{ setConfirmDeleteId(v.id); setShowConfirmDelete(true) }} aria-label={`Eliminar venta ${v.id}`} title="Eliminar">
                        <i className="fi fi-sr-trash" aria-hidden></i>
                      </button>
                    ) : (
                      <span className="action-muted" title={isLocked ? 'Pagado — no eliminable por antigüedad' : undefined}>
                        <i className="fi fi-sr-trash" style={{opacity:0.35,marginRight:6}} aria-hidden></i>
                        Eliminar
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        </>
      )}
      {/* Confirm deletion modal */}
      {showConfirmDelete && (
        <ConfirmModal
          open={showConfirmDelete}
          title="Eliminar venta"
          message={`Confirmar eliminación de la venta #${confirmDeleteId} ?`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={async ()=>{
            try{
              await api.deleteVenta(confirmDeleteId, token)
              setShowConfirmDelete(false)
              setConfirmDeleteId(null)
              load(page)
            }catch(e){ console.error(e); alert('Error al eliminar la venta'); setShowConfirmDelete(false); setConfirmDeleteId(null) }
          }}
          onCancel={()=>{ setShowConfirmDelete(false); setConfirmDeleteId(null) }}
        />
      )}
      {ventas.length>0 && (
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
          <div>
            <button onClick={()=> setPage(p => Math.max(1, p-1))} disabled={page<=1}>Anterior</button>
            <button onClick={()=> setPage(p => p+1)} disabled={!hasNext} style={{marginLeft:8}}>Siguiente</button>
          </div>
          <div style={{fontSize:13,color:'#666'}}>Página {page}</div>
        </div>
      )}
      {editing && <EditVentaModal token={token} venta={editing} onClose={()=>setEditing(null)} onSaved={()=>load(page)} />}
    </div>
  )
}
