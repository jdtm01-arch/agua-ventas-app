import React, { useEffect, useState } from 'react'
import api from '../api'

export default function Reports({ token }){
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)
  const [period, setPeriod] = useState('day')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  async function load(){
    setLoading(true)
    try{
      const params = {}
      if (from) params.from = from
      if (to) params.to = to
      if (period) params.period = period
      const res = await api.getReport(token, params)
      setReport(res)
    }catch(e){ console.error(e); alert('Error cargando reporte') }
    setLoading(false)
  }

  useEffect(()=>{ load() }, [])

  return (
    <div style={{marginTop:20}}>
      <h3>Reportes</h3>
      <div style={{display:'flex', gap:8, alignItems:'center'}}>
        <label>Periodo:
          <select value={period} onChange={e=>setPeriod(e.target.value)} style={{marginLeft:6}}>
            <option value="day">Día</option>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
            <option value="year">Año</option>
          </select>
        </label>
        <label style={{marginLeft:8}}>Desde:
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{marginLeft:6}} />
        </label>
        <label style={{marginLeft:8}}>Hasta:
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{marginLeft:6}} />
        </label>
        <button onClick={load} style={{marginLeft:8}}>Actualizar</button>
      </div>

      {loading && <div>Cargando...</div>}

      {report && (
        <div style={{marginTop:12}}>
          <div style={{display:'flex', gap:12}}>
            <div style={{padding:12, background:'#f3f4f6', borderRadius:6}}>
              <strong>Desde:</strong> {report.from_label}
            </div>
            <div style={{padding:12, background:'#f3f4f6', borderRadius:6}}>
              <strong>Hasta:</strong> {report.to_label}
            </div>
            <div style={{padding:12, background:'#eef7ff', borderRadius:6}}>
              <strong>Recaudado:</strong> ${report.total_recaudado}
            </div>
            <div style={{padding:12, background:'#fff6ee', borderRadius:6}}>
              <strong>Por cobrar:</strong> ${report.total_por_cobrar}
            </div>
            <div style={{padding:12, background:'#f0fff4', borderRadius:6}}>
              <strong>Total ventas:</strong> {report.total_ventas}
            </div>
          </div>

          <div style={{marginTop:12}}>
            <h4>Series</h4>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead>
                <tr>
                  <th style={{textAlign:'left', borderBottom:'1px solid #ddd'}}>Periodo</th>
                  <th style={{textAlign:'right', borderBottom:'1px solid #ddd'}}>Recaudado</th>
                  <th style={{textAlign:'right', borderBottom:'1px solid #ddd'}}>Por cobrar</th>
                </tr>
              </thead>
              <tbody>
                {report.series.map(s=> (
                  <tr key={s.period}>
                    <td style={{padding:'6px 0'}}>{s.label}</td>
                    <td style={{textAlign:'right'}}>${s.recaudado}</td>
                    <td style={{textAlign:'right'}}>${s.por_cobrar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
