import React, { useState } from 'react'
import api from '../api'

export default function AdminUsers({ token }){
  const [name,setName] = useState('')
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [message,setMessage] = useState(null)

  async function submit(e){
    e.preventDefault()
    try{
      const payload = { name, email, password }
      const res = await api.createUser(payload, token)
      setMessage('Usuario creado: ' + (res.user?.email || email))
      setName('')
      setEmail('')
      setPassword('')
    }catch(err){
      setMessage('Error: ' + (err.data?.message || JSON.stringify(err.data?.errors) || ''))
    }
  }

  return (
    <div style={{borderTop:'1px solid #ddd', paddingTop:12, marginTop:12}}>
      <h3>Admin: crear vendedor</h3>
      {message && <div style={{color:'green'}}>{message}</div>}
      <form onSubmit={submit}>
        <label>Nombre<input value={name} onChange={e=>setName(e.target.value)} required/></label>
        <label>Email<input value={email} onChange={e=>setEmail(e.target.value)} type="email" required/></label>
        <label>Contraseña<input value={password} onChange={e=>setPassword(e.target.value)} type="password" required/></label>
        <div><button type="submit">Crear vendedor</button></div>
      </form>
    </div>
  )
}
