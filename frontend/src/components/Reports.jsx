import React, { useEffect, useState } from 'react'
import api from '../api'

export default function Reports({ token, user }){
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)
  const [period, setPeriod] = useState('month')
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

  useEffect(()=>{ load() }, [])

  // no-op: gastos management removed from this view

  return (
    <div className="reports">
      <h2>Reportes</h2>

      <div className="reports-controls">
        <label className="reports-control">
          Periodo:
          <select value={period} onChange={e=>setPeriod(e.target.value)}>
            <option value="day">Día</option>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
            <option value="year">Año</option>
          </select>
        </label>
        <label className="reports-control">Desde:
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} />
        </label>
        <label className="reports-control">Hasta:
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} />
        </label>
        <button className="reports-button" onClick={load}>Actualizar</button>
      </div>

      {loading && <div className="reports-loading">Cargando...</div>}

      {report && (
        <div className="reports-body">
          <div className="reports-cards">
            <div className="card muted"><strong>Desde:</strong><div className="card-value">{report.from_label}</div></div>
            <div className="card muted"><strong>Hasta:</strong><div className="card-value">{report.to_label}</div></div>
            <div className="card info"><strong>Recaudado:</strong><div className="card-value">${report.total_recaudado}</div></div>
            <div className="card warning"><strong>Por cobrar:</strong><div className="card-value">${report.total_por_cobrar}</div></div>
            <div className="card danger"><strong>Gastos:</strong><div className="card-value">${report.total_gastos ?? 0}</div></div>
            <div className="card success"><strong>Recaudado neto:</strong><div className="card-value">${report.total_recaudado_neto ?? report.total_recaudado}</div></div>
            <div className="card success"><strong>Total ventas:</strong><div className="card-value">{report.total_ventas}</div></div>
          </div>

          <div className="reports-series">
            <h3>Series</h3>
            <table className="series-table">
              <thead>
                <tr>
                  <th>Periodo</th>
                  <th className="align-right">Recaudado</th>
                  <th className="align-right">Por cobrar</th>
                  <th className="align-right">Gastos</th>
                </tr>
              </thead>
              <tbody>
                {report.series.map(s=> (
                  <tr key={s.period}>
                    <td className="series-label">{s.label}</td>
                    <td className="align-right">${s.recaudado}</td>
                    <td className="align-right">${s.por_cobrar}</td>
                    <td className="align-right">${s.gastos ?? 0}</td>
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
