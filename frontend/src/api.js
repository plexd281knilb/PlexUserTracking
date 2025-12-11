import axios from 'axios';

// Base URL for backend API (uses relative path for single container)
export const API_BASE_URL = `/api`;

// Utility function to handle GET requests
export async function apiGet(path, token = null) {
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await axios.get(`${API_BASE_URL}${path}`, { headers });
    return response.data;
}

// Utility function to handle POST requests
export async function apiPost(path, data = {}, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await axios.post(`${API_BASE_URL}${path}`, data, { headers });
    return response.data;
}

// Utility function to handle DELETE requests
export async function apiDelete(path, token = null) {
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await axios.delete(`${API_BASE_URL}${path}`, { headers });
    return response.data;
}