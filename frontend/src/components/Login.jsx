import React, { useState } from 'react'
import api from '../api'
import logo from '../assets/logo.png'

export default function Login({ onLogin }){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [error,setError] = useState(null)

async function submit(e){
  e.preventDefault()
  try{
    const res = await api.login({ email, password })

    const token = res.token || res?.data?.token
    const user = res.user || res
    const isAdmin = res.is_admin ?? false

    // AGREGAR ESTO LOCAL
    localStorage.setItem("api_token", token)
    onLogin(token, user, isAdmin)

  }catch(err){
    // Prefer a server-provided message when available, otherwise show a friendly, human-readable hint
    const serverMsg = err?.response?.data?.message || err?.message
    const friendly = serverMsg && typeof serverMsg === 'string' && serverMsg.length > 3 && !/error/i.test(serverMsg)
      ? serverMsg
      : 'Usuario o contraseña incorrectos. Por favor verifica tus datos e inténtalo nuevamente.'
    setError(friendly)
    // Clear the error after a short time so the UI is not cluttered
    setTimeout(()=>setError(null), 6000)
  }
}

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <img src={logo} alt="logo" className="auth-logo" />
        <h2>Iniciar Sesión</h2>
        <p className="auth-subtitle">Ingresa tu usuario y contraseña para iniciar sesión</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={submit}>
          <label>Correo Electrónico</label>
          <input 
            data-cy="email"
            value={email} 
            onChange={e=>setEmail(e.target.value)} 
            type="email" 
            placeholder="tu@email.com"
            required
          />
          <label>Contraseña</label>
          <input 
            data-cy="password"
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            type="password" 
            placeholder="Tu contraseña"
            required
          />
          <div className="row">
            <button data-cy="login-btn" type="submit">Iniciar Sesión</button>
          </div>
        </form>
      </div>
    </div>
  )
}
