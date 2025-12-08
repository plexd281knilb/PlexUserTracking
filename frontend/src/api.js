const BASE = ''

export async function apiGet(path){
  const r = await fetch(BASE + path)
  return await r.json()
}
export async function apiPost(path, body){
  const r = await fetch(BASE + path, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body)
  })
  return await r.json()
}
export async function apiPut(path, body){
  const r = await fetch(BASE + path, {
    method: 'PUT',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body)
  })
  return r.ok
}
export async function apiDelete(path){
  const r = await fetch(BASE + path, { method: 'DELETE' })
  return r.ok
}
