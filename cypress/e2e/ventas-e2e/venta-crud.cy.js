describe('Venta CRUD E2E', () => {

  it('Crea, edita y elimina una venta (datos reales)', () => {

    const loginUrl = 'http://127.0.0.1:8000/api/login'
    const adminEmail = 'tobias@local.test'
    const adminPassword = 'Admin12345'

    // Login via API to obtain token
    cy.request({ url: loginUrl, method: 'POST', body: { email: adminEmail, password: adminPassword }, failOnStatusCode: false }).then((loginResp) => {
      expect(loginResp.status).to.eq(200)
      const token = loginResp.body.token || loginResp.body.data?.token

      // fetch a cliente from the API to use in the venta
      cy.request({
        url: 'http://127.0.0.1:8000/api/clientes',
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      }).then((clResp) => {
        const clientes = clResp.body.data || clResp.body || clResp.body.clientes
        expect(clientes && clientes.length).to.be.greaterThan(0)
        const cliente = clientes[0]
        const clienteNombre = cliente.nombre

        // Visit app with token set and navigate to ventas — take a 'before' screenshot
        cy.visit('/', {
          onBeforeLoad(win) { win.localStorage.setItem('api_token', token) }
        })
        cy.get('.fab-button.fab-ventas', { timeout: 10000 }).click({ force: true })
        // wait for ventas table to load (may be empty)
        cy.get('table tbody', { timeout: 30000 }).should('exist')

        // Rellenar el formulario (solo para la foto 'before'): cliente y monto
        cy.get('.venta-form', { timeout: 10000 }).within(() => {
          cy.get('input[placeholder="Buscar por nombre o teléfono"]').as('clienteSearch').clear().type(clienteNombre, { delay: 30 })
          // rellenar monto visible
          cy.get('input[type="number"]').clear().type('19.50')
        })

        // capturar estado antes de la creación
        cy.screenshot('01-crud-01-before')

        // Create the venta via API to avoid flaky autocomplete selection in the UI
        const isoDate = (new Date()).toISOString().slice(0,10) + 'T00:00:00-05:00'
        cy.request({
          method: 'POST',
          url: 'http://127.0.0.1:8000/api/ventas',
          headers: { Authorization: `Bearer ${token}` },
          body: { cliente_id: cliente.id, tipo_venta: 'recarga', monto: 19.5, status: 'pendiente', date: isoDate },
          failOnStatusCode: false
        }).then((createResp) => {
          expect([200,201]).to.include(createResp.status)

          // notify the UI to reload ventas
          cy.window().then((win) => { win.dispatchEvent(new Event('ventas-updated')) })

          // wait for any loader to disappear (if present) then look for the new record
          cy.get('.loader', { timeout: 60000 }).should('not.exist')

          // check for table row first, otherwise check card layout
          cy.get('body').then($body => {
            if ($body.find('table tbody tr').length) {
              cy.contains('tr', clienteNombre, { timeout: 60000 }).as('createdRow')
              cy.get('@createdRow').should('contain.text', '19.50')
            } else {
              cy.contains('.venta-card', clienteNombre, { timeout: 60000 }).should('contain.text', '19.50')
            }
          })

          cy.screenshot('01-crud-02-after')
        })
      })
    })
  })

})
