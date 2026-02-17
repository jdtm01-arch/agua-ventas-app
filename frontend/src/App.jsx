import React, { useState } from 'react'
import Login from './components/Login'
import ClienteForm from './components/ClienteForm'
import VentaForm from './components/VentaForm'
import VentasList from './components/VentasList'
import AdminUsers from './components/AdminUsers'
import GastosForm from './components/GastosForm'
import GastosList from './components/GastosList'
import api from './api'
import Reports from './components/Reports'
import Header from './components/Header'
import Footer from './components/Footer'

export default function App(){
  const [token, setToken] = useState(localStorage.getItem('api_token') || null)
  const [user, setUser] = useState(null)

    React.useEffect(() => {
    async function fetchUser(){
        if(token && !user){
        try{
            const res = await api.getUser(token)
            const fetchedUser = res.user || res
            if (res.is_admin) fetchedUser.is_admin = true
            setUser(fetchedUser)
        }catch(e){
            console.error("Error fetching user", e)
            onLogout()
        }
        }
    }

    fetchUser()
    }, [token])

  async function onLogin(tokenValue, providedUser, isAdmin){
    localStorage.setItem('api_token', tokenValue)
    setToken(tokenValue)
    try{
      const res = await api.getUser(tokenValue)
      const fetchedUser = res.user || res
      if (res.is_admin) fetchedUser.is_admin = true
      setUser(fetchedUser)
    }catch(e){
      const fallback = providedUser || {}
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
      <Header />
      <div className="card">
        {!token ? (
          <Login onLogin={onLogin} />
        ) : (
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>Usuario: {user?.email || 'conectado'}</div>
              <button onClick={onLogout}>Logout</button>
            </div>
            <Dashboard token={token} user={user} />
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

function Dashboard({ token, user }){
  const [view, setView] = React.useState(user?.is_admin ? 'reportes' : 'ventas')

  const adminButtons = [
    { key: 'reportes', label: 'Reportes' },
    { key: 'ventas', label: 'Ventas' },
    { key: 'clientes', label: 'Clientes' },
    { key: 'gastos', label: 'Gastos' },
    { key: 'usuarios', label: 'Usuarios' },
  ]

  const vendedorButtons = [
    { key: 'ventas', label: 'Ventas' },
    { key: 'clientes', label: 'Clientes' },
    { key: 'gastos', label: 'Gastos' },
    { key: 'reportes', label: 'Reportes' },
  ]

  const buttons = user?.is_admin ? adminButtons : vendedorButtons

  return (
    <div style={{marginTop:12}}>
      <div style={{display:'flex', gap:8, marginBottom:12}}>
        {buttons.map(b => (
          <button key={b.key} onClick={()=>setView(b.key)} style={{padding:'8px 12px'}}>{b.label}</button>
        ))}
      </div>

      <div style={{border:'1px solid #eee', padding:12, borderRadius:6}}>
        {view === 'reportes' && <Reports token={token} user={user} />}
        {view === 'ventas' && (
          <div>
            <VentaForm token={token} />
            <VentasList token={token} />
          </div>
        )}
        {view === 'clientes' && <ClienteForm token={token} />}
        {view === 'gastos' && (
          <div>
            <GastosForm token={token} user={user} onCreated={()=>window.dispatchEvent(new Event('gastos-updated'))} />
            <div style={{marginTop:12}}>
              <GastosList token={token} onChanged={()=>window.dispatchEvent(new Event('gastos-updated'))} />
            </div>
          </div>
        )}
        {view === 'usuarios' && user?.is_admin && <AdminUsers token={token} />}
      </div>
    </div>
  )
}
