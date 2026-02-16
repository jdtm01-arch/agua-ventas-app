import React, { useState } from 'react'
import api from '../api'

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

    // 🔥 AGREGAR ESTO
    localStorage.setItem("token", token)
    localStorage.setItem("isAdmin", isAdmin ? "1" : "0")
    localStorage.setItem("user", JSON.stringify(user))

    onLogin(token, user, isAdmin)

  }catch(err){
    setError('Error')
  }
}

  return (
    <div>
      <h2>Login</h2>
      {error && <div style={{color:'red'}}>{error}</div>}
      <form onSubmit={submit}>
        <label>Email<input value={email} onChange={e=>setEmail(e.target.value)} type="email" required/></label>
        <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" required/></label>
        <div className="row">
          <button type="submit">Login</button>
        </div>
      </form>
    </div>
  )
}
