const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Accept': 'application/json' }
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body && !(body instanceof FormData) ? JSON.stringify(body) : body
  })

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json() : null
  if (!res.ok) throw { status: res.status, data }
  return data
}

export function login(payload){ return request('/login', { method: 'POST', body: payload }) }
export function logout(token){ return request('/logout', { method: 'POST', token }) }
export function getUser(token){ return request('/user', { method: 'GET', token }) }
export function getClientes(token, params = {}){
  const qs = new URLSearchParams(params).toString()
  return request(`/clientes${qs?('?'+qs):''}`, { method: 'GET', token })
}
export function createCliente(payload, token){ return request('/clientes', { method: 'POST', body: payload, token }) }
export function updateCliente(id, payload, token){ return request(`/clientes/${id}`, { method: 'PUT', body: payload, token }) }
export function deleteCliente(id, token){ return request(`/clientes/${id}`, { method: 'DELETE', token }) }
export function getVentas(token, params = {}){
  const qs = new URLSearchParams(params).toString()
  return request(`/ventas${qs?('?'+qs):''}`, { method: 'GET', token })
}
export function createVenta(payload, token){ return request('/ventas', { method: 'POST', body: payload, token }) }
export function deleteVenta(id, token){ return request(`/ventas/${id}`, { method: 'DELETE', token }) }
export function updateVenta(id, payload, token){ return request(`/ventas/${id}`, { method: 'PUT', body: payload, token }) }
export function updateStatus(id, payload, token){ return request(`/ventas/${id}/status`, { method: 'PATCH', body: payload, token }) }
export function createUser(payload, token){ return request('/users', { method: 'POST', body: payload, token }) }
export function getReport(token, params = {}){
  const qs = new URLSearchParams(params).toString()
  return request(`/ventas/report${qs?('?'+qs):''}`, { method: 'GET', token })
}
export function getTiposDeGasto(token){ return request('/tipos-de-gasto', { method: 'GET', token }) }
export function getGastos(token, params = {}){ const qs = new URLSearchParams(params).toString(); return request(`/gastos${qs?('?'+qs):''}`, { method: 'GET', token }) }
export function createGasto(payload, token){ return request('/gastos', { method: 'POST', body: payload, token }) }
export function updateGasto(id, payload, token){ return request(`/gastos/${id}`, { method: 'PUT', body: payload, token }) }
export function deleteGasto(id, confirm, token){ return request(`/gastos/${id}`, { method: 'DELETE', body: { confirm: !!confirm }, token }) }

export default {
  login, logout, getUser,
  getClientes, createCliente, updateCliente,
  getVentas, createVenta, deleteVenta, updateVenta, updateStatus,
  createUser,
  getReport,
  getTiposDeGasto, getGastos, createGasto, updateGasto, deleteGasto
}
