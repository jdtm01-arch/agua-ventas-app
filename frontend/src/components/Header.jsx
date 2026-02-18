import React, { useState } from 'react'
import logo from '../assets/logo.png'
import { NOMBRE_EMPRESA, SLOGAN } from '../config'
import ConfirmModal from './ConfirmModal'

export default function Header({ user, onLogout, view, setView }){
  const [open, setOpen] = useState(false)

  const adminItems = [
    { key: 'reportes', label: 'Reportes' },
    { key: 'ventas', label: 'Ventas' },
    { key: 'clientes', label: 'Clientes' },
    { key: 'gastos', label: 'Gastos' },
    { key: 'usuarios', label: 'Usuarios' },
  ]

  const vendedorItems = [
    { key: 'ventas', label: 'Ventas' },
    { key: 'clientes', label: 'Clientes' },
    { key: 'gastos', label: 'Gastos' },
    { key: 'reportes', label: 'Reportes' },
  ]

  const items = user?.is_admin ? adminItems : vendedorItems

  function handleSelect(k){
    setView && setView(k)
    setOpen(false)
  }

  function handleLogout(){
    // open modal instead of immediate confirm
    setShowLogoutConfirm(true)
  }

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // Only show header if user is logged in
  if (!user) return null

  return (
    <header className="app-header">
      <div className="container">
        <div className="brand">
          <img src={logo} alt={NOMBRE_EMPRESA} />
          <div>
            <div className="brand-title">{NOMBRE_EMPRESA}</div>
            <div className="brand-slogan">{SLOGAN}</div>
          </div>
        </div>

        <nav className="nav">
          <button className="hamburger" onClick={()=>setOpen(!open)} aria-label="menu">☰</button>
          <ul className={`nav-menu ${open ? 'open' : ''}`}>
            {items.map(i=> (
              <li key={i.key} className={`nav-item ${view===i.key? 'active':''}`} onClick={()=>handleSelect(i.key)}>{i.label}</li>
            ))}
            {/* User info inside the mobile menu (hidden on large screens via CSS) */}
            <li className="nav-user">
              <div className="user-email">{user?.email || 'conectado'}</div>
              <button className="btn-ghost" onClick={()=>{ setOpen(false); handleLogout(); }}>Logout</button>
            </li>
          </ul>
        </nav>

        <div className="user-area">
          <div className="user-email">{user?.email || 'conectado'}</div>
          <button className="btn-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </div>
      <ConfirmModal
        open={showLogoutConfirm}
        title="Cerrar sesión"
        message="¿Estás seguro que deseas cerrar sesión?"
        confirmText="Cerrar sesión"
        cancelText="Cancelar"
        onConfirm={()=>{ setShowLogoutConfirm(false); onLogout && onLogout() }}
        onCancel={()=> setShowLogoutConfirm(false)}
      />
    </header>
  )
}
