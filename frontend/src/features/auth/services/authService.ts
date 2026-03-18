import axiosInstance, { ensureCsrf } from '../../../api/axios';
import { ENDPOINTS } from '../../../api/endpoints';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  plan?: string;
}

export interface LoginResponse {
  user: User;
  token?: string;
}

const authService = {
  async login(credentials: Record<string, any>): Promise<User> {
    await ensureCsrf();
    const response = await axiosInstance.post(ENDPOINTS.AUTH.LOGIN, credentials);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data.user;
  },

  async logout(): Promise<void> {
    await axiosInstance.post(ENDPOINTS.AUTH.LOGOUT);
    localStorage.removeItem('auth_token');
  },

  async getCurrentUser(): Promise<User> {
    const response = await axiosInstance.get(ENDPOINTS.AUTH.USER);
    return response.data;
  }
};

export default authService;
