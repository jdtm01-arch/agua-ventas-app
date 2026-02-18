import React, { useEffect, useState } from 'react'
import api from '../api'

export default function Reports({ token, user }){
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)
  const [period, setPeriod] = useState('day')
  // Force current month range
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0,10)
  const monthEnd = new Date(today.getFullYear(), today.getMonth()+1, 0).toISOString().slice(0,10)
  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(monthEnd)

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

  function formatDateDMY(iso){
    if (!iso) return ''
    const s = String(iso)
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) return `${m[3]}/${m[2]}/${m[1]}`
    const m2 = s.match(/^(\d{4})-(\d{2})$/)
    if (m2) return `01/${m2[2]}/${m2[1]}`
    return s
  }

  function formatCurrency(v){
    const n = Number(v) || 0
    try{ return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }) }
    catch(e){ return `S/ ${n.toFixed(2)}` }
  }

  useEffect(()=>{ load() }, [])

  // no-op: gastos management removed from this view

  return (
    <div className="reports">
      <h2>Reportes</h2>

      

      {loading && (
        <div className="reports-loading">
          <div className="loader" role="status" aria-label="Cargando"></div>
        </div>
      )}

      {report && (
        <div className="reports-body">
          <div className="reports-controls" style={{marginBottom:12}}>
            <div className="reports-period">
              <label className="reports-control">Periodo:
                <select value={period} onChange={e=>setPeriod(e.target.value)}>
                  <option value="day">Día</option>
                  <option value="week">Semana</option>
                  <option value="month">Mes</option>
                  <option value="year">Año</option>
                </select>
              </label>
            </div>
            <div className="reports-dates">
              <label className="reports-control">Desde:
                <input type="date" value={from} onChange={e=>setFrom(e.target.value)} />
              </label>
              <label className="reports-control">Hasta:
                <input type="date" value={to} onChange={e=>setTo(e.target.value)} />
              </label>
            </div>
            <div className="reports-action">
              <button className="reports-button" onClick={load}>Actualizar</button>
            </div>
          </div>

          <div className="reports-cards">
            <div className="card info"><strong>Recaudado:</strong><div className="card-value">{formatCurrency(report.total_recaudado)}</div></div>
            <div className="card warning"><strong>Por cobrar:</strong><div className="card-value">{formatCurrency(report.total_por_cobrar)}</div></div>
            <div className="card danger"><strong>Gastos:</strong><div className="card-value">{formatCurrency(report.total_gastos ?? 0)}</div></div>
            <div className="card success"><strong>Recaudado neto:</strong><div className="card-value">{formatCurrency(report.total_recaudado_neto ?? report.total_recaudado)}</div></div>
            <div className="card success"><strong>Total ventas:</strong><div className="card-value">{report.total_ventas}</div></div>
          </div>

          <div className="reports-series">
            <div style={{overflowX:'auto'}}>
            <table className="ventas-table series-table">
              <thead>
                <tr>
                  <th>Periodo</th>
                  <th className="align-right">Recaudado</th>
                  <th className="align-right">Por cobrar</th>
                  <th className="align-right">Gastos</th>
                </tr>
              </thead>
              <tbody>
                {report.series.map(s=> {
                  const r = Number(s.recaudado) || 0
                  const p = Number(s.por_cobrar) || 0
                  const g = Number(s.gastos) || 0
                  return (
                  <tr key={s.period}>
                    <td className="series-label">{ s.label ? (String(s.label).includes('-') ? formatDateDMY(s.label) : s.label) : formatDateDMY(s.period) }</td>
                    <td className={`recaudado ${r===0? 'is-zero':''}`}>{formatCurrency(r)}</td>
                    <td className={`por-cobrar ${p===0? 'is-zero':''}`}>{formatCurrency(p)}</td>
                    <td className={`gastos ${g===0? 'is-zero':''}`}>{formatCurrency(g)}</td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
