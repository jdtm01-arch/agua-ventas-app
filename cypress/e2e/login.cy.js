describe('Login App Estado Interno', () => {

  it('Debe mostrar dashboard después de login', () => {

    // Perform real login against backend and capture dashboard with real data
    // Use the backend full URL (backend runs on port 8000) so the request hits the API directly
    const loginUrl = 'http://127.0.0.1:8000/api/login'
    const adminEmail = 'admin@local.test'
    const adminPassword = 'Admin12345'

    cy.request({ url: loginUrl, method: 'POST', body: { email: adminEmail, password: adminPassword }, failOnStatusCode: false }).then((loginResp) => {
      if (loginResp.status !== 200) {
        throw new Error('Real login failed; ensure backend is running and credentials are correct')
      }
      const token = loginResp.body.token || loginResp.body.data?.token

      // Alias real network calls so we can wait for them (no mocking)
      cy.intercept('GET', '**/user').as('getUser')
      cy.intercept('GET', '**/ventas*').as('getVentas')

      cy.visit('/', {
        onBeforeLoad(win) {
          win.localStorage.setItem('api_token', token)
        }
      })

      cy.wait('@getUser')
      cy.wait('@getVentas')

      // If the logged user is admin the default view is 'reportes'. Switch to Ventas.
      cy.contains('.nav-item', 'Ventas').click()
      // wait for ventas to load after switching view
      cy.wait('@getVentas')
      cy.get('.ventas-header', { timeout: 30000 }).should('be.visible')

      // Wait for actual data rows/cards to appear in the table (not just headers)
      cy.get('table tbody tr, .venta-card', { timeout: 30000 }).should('exist')

      // capture screenshots after dashboard visible and data loaded
      cy.viewport(1280, 800)
      cy.wait(2000)
      cy.screenshot('dashboard-desktop')
      cy.get('.ventas-header').screenshot('dashboard-title-desktop')

      cy.viewport(768, 1024)
      cy.wait(2000)
      cy.screenshot('dashboard-tablet')
      cy.get('.ventas-header').screenshot('dashboard-title-tablet')

      cy.viewport(375, 812)
      cy.wait(2000)
      cy.screenshot('dashboard-mobile')
      cy.get('.ventas-header').screenshot('dashboard-title-mobile')
    })

  })

})
