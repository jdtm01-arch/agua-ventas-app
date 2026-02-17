import React from 'react'
import logo from '../assets/logo.png'
import { NOMBRE_EMPRESA, SLOGAN } from '../config'

export default function Header(){
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
      </div>
    </header>
  )
}
