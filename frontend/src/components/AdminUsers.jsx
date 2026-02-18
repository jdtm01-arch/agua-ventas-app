import React, { useState, useRef, useEffect } from 'react'
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
      setMessage({ text: 'Usuario creado: ' + (res.user?.email || email), type: 'success' })
      setName('')
      setEmail('')
      setPassword('')
    }catch(err){
      setMessage({ text: 'Error: ' + (err.data?.message || JSON.stringify(err.data?.errors) || ''), type: 'error' })
    }
  }

  const messageRef = useRef(null)
  const messageTimeoutRef = useRef(null)
  useEffect(()=>{
    if (!message) return
    if (messageRef.current) messageRef.current.focus()
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
    messageTimeoutRef.current = setTimeout(()=> setMessage(null), 5000)
    return ()=>{ if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current) }
  }, [message])

  return (
    <div style={{paddingTop:12, marginTop:12}}>
      <h2>Admin: crear vendedor</h2>
      {message && (
        <div ref={messageRef} tabIndex={-1} className={message.type === 'error' ? 'message-error' : 'message-success'}>
          {message.text}
        </div>
      )}
      <form onSubmit={submit}>
        <label>Nombre<input value={name} onChange={e=>setName(e.target.value)} required/></label>
        <label>Email<input value={email} onChange={e=>setEmail(e.target.value)} type="email" required/></label>
        <label>Contraseña<input value={password} onChange={e=>setPassword(e.target.value)} type="password" required/></label>
        <div className="button-submit-right">
          <button type="submit">Crear vendedor</button>
        </div>
      </form>
    </div>
  )
}
