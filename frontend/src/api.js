// frontend/src/api.js

const getBaseUrl = () => {
    // If we are in development (running on port 3000), point to port 5052
    if (window.location.hostname === 'localhost' && window.location.port === '3000') {
        return 'http://localhost:5052/api';
    }
    // In production, use relative path
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
        
        if (response.status === 401) {
            console.warn("Unauthorized request");
        }

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

export const apiGet = (endpoint, token = null) => request(endpoint, 'GET', null, token);

export const apiPost = (endpoint, body, token = null) => request(endpoint, 'POST', body, token);

export const apiPut = (endpoint, body, token = null) => request(endpoint, 'PUT', body, token);

export const apiDelete = (endpoint, token = null) => request(endpoint, 'DELETE', null, token);