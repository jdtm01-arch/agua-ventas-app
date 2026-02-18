describe('Editar última venta E2E', () => {
  it('Edita monto y status de la última venta y toma capturas', () => {
    const loginUrl = 'http://127.0.0.1:8000/api/login'
    const adminEmail = 'tobias@local.test'
    const adminPassword = 'Admin12345'

    // Login
    cy.request({ url: loginUrl, method: 'POST', body: { email: adminEmail, password: adminPassword }, failOnStatusCode: false }).then(loginResp => {
      expect(loginResp.status).to.eq(200)
      const token = loginResp.body.token || loginResp.body.data?.token

      // Fetch ventas and pick the most recent by created_at or highest id
      cy.request({ url: 'http://127.0.0.1:8000/api/ventas', method: 'GET', headers: { Authorization: `Bearer ${token}` } }).then(vResp => {
        const ventas = vResp.body.data || vResp.body || vResp.body.ventas || []
        expect(ventas.length).to.be.greaterThan(0)
        // choose latest by created_at if available, else by max id
        const sorted = ventas.slice().sort((a,b)=>{
          const da = new Date(a.created_at || a.createdAt || 0).getTime() || 0
          const db = new Date(b.created_at || b.createdAt || 0).getTime() || 0
          if (da === db) return (b.id || 0) - (a.id || 0)
          return db - da
        })
        const venta = sorted[0]
        const ventaId = venta.id
        const clienteNombre = venta.cliente?.nombre || ''
        const originalMonto = Number(venta.monto || 0)
        const originalStatus = venta.status || 'pendiente'

        // Prepare new values
        const newMonto = (originalMonto + 1.25).toFixed(2)
        const newStatus = originalStatus === 'pendiente' ? 'entregado' : 'pendiente'

        // Visit UI and open ventas
        cy.visit('/', { onBeforeLoad(win){ win.localStorage.setItem('api_token', token) } })
        cy.get('.fab-button.fab-ventas', { timeout: 10000 }).click({ force: true })

        // Wait for table and find the row by ID
        cy.get('table tbody', { timeout: 30000 }).contains('tr', String(ventaId), { timeout: 30000 }).as('targetRow')

        // Click the edit button for that venta
        cy.get('@targetRow').within(() => {
          cy.get(`button[aria-label="Editar venta ${ventaId}"]`, { timeout: 10000 }).click()
        })

        // Wait for modal, take screenshot (before editing)
        cy.get('.modal-dialog', { timeout: 10000 }).should('be.visible')
        cy.screenshot('02-venta-edit-01-open')

        // Fill fields inside modal
        cy.get('.modal-dialog').within(() => {
          // change status using the Status label's select
          cy.contains('label', 'Status').find('select').select(newStatus)
          // change monto (input[type=number])
          cy.get('input[type="number"]').clear().type(String(newMonto))
          // screenshot before submit
          cy.screenshot('02-venta-edit-02-filled')
          // submit
          cy.contains('button', 'Guardar').click()
        })

        // Wait for modal to close and loader disappear
        cy.get('.modal-dialog', { timeout: 20000 }).should('not.exist')
        cy.get('.loader', { timeout: 30000 }).should('not.exist')

        // Wait for table row to reflect changes
        cy.get('table tbody', { timeout: 60000 }).contains('tr', String(ventaId), { timeout: 60000 }).as('updatedRow')
        cy.get('@updatedRow').should('contain.text', newMonto)
        cy.get('@updatedRow').should('contain.text', newStatus.toUpperCase())
        cy.screenshot('02-venta-edit-03-after')
      })
    })
  })
})
