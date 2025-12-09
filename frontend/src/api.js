import axios from "axios";
const API = process.env.REACT_APP_API_URL || "";

export function apiGet(path, token) {
  return axios.get(API + path, { headers: token ? { "X-Admin-Token": token } : {} }).then(r => r.data);
}
export function apiPost(path, body, token) {
  return axios.post(API + path, body, { headers: token ? { "X-Admin-Token": token } : {} }).then(r => r.data);
}
export function apiPut(path, body, token) {
  return axios.put(API + path, body, { headers: token ? { "X-Admin-Token": token } : {} }).then(r => r.data);
}
export function apiDelete(path, token) {
  return axios.delete(API + path, { headers: token ? { "X-Admin-Token": token } : {} }).then(r => r.data);
}
