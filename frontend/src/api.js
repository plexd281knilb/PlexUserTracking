const BASE = ''

export async function apiGet(path, token){
  const headers = token ? {'X-Admin-Token': token} : {}
  const r = await fetch(BASE + path, {headers})
  if (!r.ok) throw new Error('API error ' + r.status)
  return await r.json()
}

export async function apiPost(path, body, token){
  const headers = {'Content-Type':'application/json'}
  if (token) headers['X-Admin-Token'] = token
  const r = await fetch(path, {method:'POST', headers, body: JSON.stringify(body)})
  return await r.json()
}

export async function apiPut(path, body, token){
  const headers = {'Content-Type':'application/json'}
  if (token) headers['X-Admin-Token'] = token
  const r = await fetch(path, {method:'PUT', headers, body: JSON.stringify(body)})
  return await r.json()
}
