describe('Crear → Editar → Eliminar venta (E2E final)', () => {
  it('Crea una venta por API, la edita por UI y la elimina, con captura final', () => {
    const loginUrl = 'http://127.0.0.1:8000/api/login'
    const adminEmail = 'tobias@local.test'
    const adminPassword = 'Admin12345'

    cy.request({ url: loginUrl, method: 'POST', body: { email: adminEmail, password: adminPassword }, failOnStatusCode: false }).then(loginResp => {
      expect(loginResp.status).to.eq(200)
      const token = loginResp.body.token || loginResp.body.data?.token

      // get a cliente
      cy.request({ url: 'http://127.0.0.1:8000/api/clientes', method: 'GET', headers: { Authorization: `Bearer ${token}` } }).then(clResp => {
        const clientes = clResp.body.data || clResp.body || clResp.body.clientes || []
        expect(clientes.length).to.be.greaterThan(0)
        const cliente = clientes[0]
        const clienteNombre = cliente.nombre

        // prepare a unique monto and show the form before creating (screenshot 'before create')
        const uniqueSuffix = Date.now() % 10000
        const uniqueMonto = Number((10 + uniqueSuffix / 100).toFixed(2))
        const isoDate = (new Date()).toISOString().slice(0,10) + 'T00:00:00-05:00'

        // Visit UI and fill form to capture 'before create' state
        cy.visit('/', { onBeforeLoad(win){ win.localStorage.setItem('api_token', token) } })
        cy.get('.fab-button.fab-ventas', { timeout: 10000 }).click({ force: true })
        cy.get('.venta-form', { timeout: 10000 }).within(() => {
          cy.get('input[placeholder="Buscar por nombre o teléfono"]').clear().type(clienteNombre, { delay: 30 })
          cy.get('input[type="number"]').clear().type(String(uniqueMonto))
        })
        cy.screenshot('03-delete-01-before-create')

        // create venta via API and capture id
        cy.request({ method: 'POST', url: 'http://127.0.0.1:8000/api/ventas', headers: { Authorization: `Bearer ${token}` }, body: { cliente_id: cliente.id, tipo_venta: 'recarga', monto: uniqueMonto, status: 'pendiente', date: isoDate }, failOnStatusCode: false }).then(createResp => {
          expect([200,201]).to.include(createResp.status)
          const created = createResp.body || createResp.body.data || createResp.body.venta || {}
          const createdId = created.id || created.data?.id || null

          // Visit UI and show ventas
          cy.visit('/', { onBeforeLoad(win){ win.localStorage.setItem('api_token', token) } })
          cy.get('.fab-button.fab-ventas', { timeout: 10000 }).click({ force: true })

          // Wait for the new row: prefer matching by returned ID, fallback to cliente+unique monto
          const needle = String(uniqueMonto)
          cy.get('table tbody tr', { timeout: 60000 }).then($rows => {
            let found = null
            if (createdId) {
              found = Array.from($rows).find(r => r.innerText.includes(String(createdId)))
            }
            if (!found) {
              found = Array.from($rows).find(r => r.innerText.includes(clienteNombre) && r.innerText.includes(needle))
            }
            expect(found, 'fila creada encontrada').to.exist
            cy.wrap(found).as('row')
          })

          // Edit via UI: if we have the ID, click the specific edit button; otherwise click the row's first edit action
          cy.get('@row').within(() => {
            if (createdId) {
              cy.get(`button[aria-label="Editar venta ${createdId}"]`, { timeout: 10000 }).click()
            } else {
              cy.get('button.action-btn').first().click()
            }
          })

          // Wait modal, assert it shows the created venta, take screenshot of edit modal
          cy.get('.modal-dialog', { timeout: 10000 }).should('be.visible')
          cy.get('.modal-dialog').within(() => {
            // modal should show cliente and monto equal to the created venta
            cy.contains(clienteNombre).should('exist')
            cy.get('input[type="number"]').should('have.value', String(uniqueMonto))
            cy.screenshot('03-delete-02-edit-open')

            // change status and monto before saving
            cy.contains('label', 'Status').find('select').then($s => {
              const current = $s.val()
              const next = current === 'pendiente' ? 'entregado' : 'pendiente'
              cy.wrap($s).select(next)
            })
            cy.get('input[type="number"]').clear().type('22.22')
            cy.screenshot('03-delete-03-filled-before-save')
            cy.contains('button', 'Guardar').click()
          })

          // wait for modal close and UI reload
          cy.get('.modal-dialog', { timeout: 20000 }).should('not.exist')
          cy.window().then(win => win.dispatchEvent(new Event('ventas-updated')))
          cy.get('.loader', { timeout: 30000 }).should('not.exist')

          // find the updated row again (after edit)
          cy.get('table tbody', { timeout: 60000 }).contains('tr', createdId ? String(createdId) : '22.22', { timeout: 60000 }).as('updated')

          // capture screenshot showing the edited record in the table (before deletion)
          cy.get('@updated').should('contain.text', '22.22')
          cy.screenshot('03-delete-04-after-edit')

          // Delete via UI
          cy.get('@updated').within(() => {
            cy.get('button.action-btn.danger').click()
          })

          // Confirm deletion
          cy.get('.modal-dialog', { timeout: 10000 }).within(() => {
            cy.contains('button', 'Eliminar').click()
          })

          // Wait for deletion to complete and assert absence
          cy.get('.loader', { timeout: 30000 }).should('not.exist')
          cy.get('table tbody', { timeout: 60000 }).should('not.contain', createdId ? String(createdId) : '22.22')
          cy.screenshot('03-delete-05-final')
        })
      })
    })
  })
})
