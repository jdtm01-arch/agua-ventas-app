import React, { useState } from 'react'
import Login from './components/Login'
import ClienteForm from './components/ClienteForm'
import VentaForm from './components/VentaForm'
import VentasList from './components/VentasList'
import AdminUsers from './components/AdminUsers'
import api from './api'
import Reports from './components/Reports'

export default function App(){
  const [token, setToken] = useState(localStorage.getItem('api_token') || null)
  const [user, setUser] = useState(null)

  async function onLogin(token, user, isAdmin){
    localStorage.setItem('api_token', token)
    setToken(token)
    // try to fetch fresh user info
    try{
      const res = await api.getUser(token)
      const fetchedUser = res.user || res
      if (res.is_admin) fetchedUser.is_admin = true
      setUser(fetchedUser)
    }catch(e){
      // fallback to provided user
      const fallback = user || {}
      if (isAdmin) fallback.is_admin = true
      setUser(fallback)
    }
  }

  function onLogout(){
    localStorage.removeItem('api_token')
    setToken(null)
    setUser(null)
  }

  return (
    <div>
      <h1 style={{textAlign:'center'}}>Agua Ventas (Frontend demo)</h1>
      <div className="card">
        {!token ? (
          <Login onLogin={onLogin} />
        ) : (
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>Usuario: {user?.email || 'conectado'}</div>
              <button onClick={onLogout}>Logout</button>
            </div>
            <ClienteForm token={token} />
            <VentaForm token={token} />
            <VentasList token={token} />
            <Reports token={token} />
            {user?.is_admin && <AdminUsers token={token} />}
          </div>
        )}
      </div>
    </div>
  )
}
