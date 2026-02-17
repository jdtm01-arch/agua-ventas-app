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
  const [view, setView] = useState(null)

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
      <Header user={user} onLogout={onLogout} view={view || (user?.is_admin ? 'reportes' : 'ventas')} setView={setView} />
      <div className="card">
        {!token ? (
          <Login onLogin={onLogin} />
        ) : (
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div style={{fontSize:14,color:'var(--muted)'}}>Usuario: {user?.email || 'conectado'}</div>
            </div>
            <Dashboard token={token} user={user} view={view || (user?.is_admin ? 'reportes' : 'ventas')} setView={setView} />
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

function Dashboard({ token, user, view, setView }){
  return (
    <div style={{marginTop:12}}>
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
