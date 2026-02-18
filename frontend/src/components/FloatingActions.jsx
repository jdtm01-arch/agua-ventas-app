import React from 'react'

export default function FloatingActions({ setView, currentView }){
  function goVentas(){
    setView && setView('ventas')
    // on small screens we may want to scroll to top of main content
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function goClientes(){
    setView && setView('clientes')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function goGastos(){
    setView && setView('gastos')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="fab-container" role="navigation" aria-label="Acciones rápidas">
      <div className={`fab-item ${currentView==='ventas' ? 'active' : ''}`}>
        <button className={`fab-button fab-ventas ${currentView==='ventas' ? 'active' : ''}`} onClick={goVentas} aria-label="Añadir venta" aria-pressed={currentView==='ventas'}>
          <i className="fi fi-sr-add" aria-hidden></i>
        </button>
        <div className="fab-label">Ventas</div>
      </div>

      <div className={`fab-item ${currentView==='clientes' ? 'active' : ''}`}>
        <button className={`fab-button fab-clientes ${currentView==='clientes' ? 'active' : ''}`} onClick={goClientes} aria-label="Añadir cliente" aria-pressed={currentView==='clientes'}>
          <i className="fi fi-sr-user-add" aria-hidden></i>
        </button>
        <div className="fab-label">Clientes</div>
      </div>
      
      <div className={`fab-item ${currentView==='gastos' ? 'active' : ''}`}>
        <button className={`fab-button fab-gastos ${currentView==='gastos' ? 'active' : ''}`} onClick={goGastos} aria-label="Añadir gasto" aria-pressed={currentView==='gastos'}>
          <i className="fi fi-br-cheap-dollar" aria-hidden></i>
        </button>
        <div className="fab-label">Gastos</div>
      </div>
    </div>
  )
}
