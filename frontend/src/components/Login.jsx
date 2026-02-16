import React, { useState } from 'react'
import api from '../api'

export default function Login({ onLogin }){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [error,setError] = useState(null)
  const [registerMode,setRegisterMode] = useState(false)

  async function submit(e){
    e.preventDefault()
    try{
      const fn = registerMode ? api.register : api.login
      const res = await fn({ email, password, name: registerMode ? email.split('@')[0] : undefined })
      const token = res.token || res?.data?.token
      onLogin(token, res.user || res)
    }catch(err){
      setError(err?.data?.message || (err?.data?.errors ? JSON.stringify(err.data.errors) : 'Error'))
    }
  }

  return (
    <div>
      <h2>{registerMode ? 'Register' : 'Login'}</h2>
      {error && <div style={{color:'red'}}>{error}</div>}
      <form onSubmit={submit}>
        <label>Email<input value={email} onChange={e=>setEmail(e.target.value)} type="email" required/></label>
        <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" required/></label>
        <div className="row">
          <button type="submit">{registerMode ? 'Register' : 'Login'}</button>
          <button type="button" onClick={()=>setRegisterMode(!registerMode)}>{registerMode ? 'Switch to Login' : 'Switch to Register'}</button>
        </div>
      </form>
    </div>
  )
}
