export const BASE_URL = 'http://localhost:8080';
export const API_BASE_URL = `${BASE_URL}/api`;

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/login',
    LOGOUT: '/logout',
    USER: '/user',
    CSRF: `${BASE_URL}/sanctum/csrf-cookie`,
  },
  USERS: '/users',
  INTEGRATIONS: '/integrations',
};

export default ENDPOINTS;
