import React, { useEffect, useState } from 'react'
import api from '../api'

export default function VentasList({ token }){
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(false)

  async function load(){
    setLoading(true)
    try{
      const res = await api.getVentas(token)
      setVentas(res.data || res.ventas || res)
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
        {ventas.map(v=> (
          <li key={v.id}>
            <strong>#{v.id}</strong> {v.cliente?.nombre || v.cliente_id} — {v.tipo_venta} — {v.monto} — <em>{v.status}</em>
          </li>
        ))}
      </ul>
    </div>
  )
}
