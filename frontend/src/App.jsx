import React, { useState } from 'react'
import Login from './components/Login'
import ClienteForm from './components/ClienteForm'
import VentaForm from './components/VentaForm'
import VentasList from './components/VentasList'

export default function App(){
  const [token, setToken] = useState(localStorage.getItem('api_token') || null)
  const [user, setUser] = useState(null)

  function onLogin(token, user){
    localStorage.setItem('api_token', token)
    setToken(token)
    setUser(user)
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
          </div>
        )}
      </div>
    </div>
  )
}
