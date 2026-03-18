import axios from 'axios';
import { API_BASE_URL, ENDPOINTS } from './endpoints';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const setupAxiosInterceptors = (onErrorHandler: (message: string) => void) => {
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      onErrorHandler(message);
      return Promise.reject(error);
    }
  );
};

// For Sanctum CSRF protection
export const ensureCsrf = async () => {
  await axios.get(ENDPOINTS.AUTH.CSRF, { withCredentials: true });
};

export default axiosInstance;
