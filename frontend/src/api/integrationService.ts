import axiosInstance from './axios';
import { ENDPOINTS } from './endpoints';

export interface Integration {
  id: number;
  type: 'wa_sender' | 'meta';
  phone_number: string;
  webhook_url: string;
  webhook_secret?: string;
  api_key: string;
  secret_key?: string;
  created_at: string;
}

const integrationService = {
  async getAll(): Promise<Integration[]> {
    const response = await axiosInstance.get(ENDPOINTS.INTEGRATIONS);
    return response.data;
  },

  async create(data: Partial<Integration>): Promise<Integration> {
    const response = await axiosInstance.post(ENDPOINTS.INTEGRATIONS, data);
    return response.data.integration;
  },

  async update(id: number, data: Partial<Integration>): Promise<Integration> {
    const response = await axiosInstance.put(`${ENDPOINTS.INTEGRATIONS}/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`${ENDPOINTS.INTEGRATIONS}/${id}`);
  }
};

export default integrationService;
