// frontend/src/api.js

const getBaseUrl = () => {
    // If we are in development (running on port 3000), point to port 5000
    // If in production (docker), use relative path
    if (window.location.hostname === 'localhost' && window.location.port === '3000') {
        return 'http://localhost:5000/api';
    }
    return '/api';
};

const BASE_URL = getBaseUrl();

const request = async (endpoint, method = 'GET', body = null, token = null) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        
        // Handle 401 Unauthorized (optional: redirect to login)
        if (response.status === 401) {
            console.warn("Unauthorized request");
        }

        // Return empty object for 204 No Content
        if (response.status === 204) return {};

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || data.message || 'API Request Failed');
        }
        
        return data;
    } catch (error) {
        console.error(`API Error (${method} ${endpoint}):`, error);
        throw error;
    }
};

// --- EXPORTED FUNCTIONS ---

export const apiGet = (endpoint, token = null) => request(endpoint, 'GET', null, token);

export const apiPost = (endpoint, body, token = null) => request(endpoint, 'POST', body, token);

export const apiPut = (endpoint, body, token = null) => request(endpoint, 'PUT', body, token);

export const apiDelete = (endpoint, token = null) => request(endpoint, 'DELETE', null, token);