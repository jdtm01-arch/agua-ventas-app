import React from 'react'
import { NOMBRE_EMPRESA } from '../config'

export default function Footer(){
  return (
    <footer className="app-footer">
      <div className="container">© {new Date().getFullYear()} {NOMBRE_EMPRESA}. Todos los derechos reservados.</div>
    </footer>
  )
}
