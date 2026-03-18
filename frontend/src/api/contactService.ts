import axios from '@/api/axios';

export interface Contact {
  id: number;
  user_id: number;
  name: string;
  phone_number: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

const contactService = {
  getAll: async (page = 1, perPage = 10, search = '') => {
    const response = await axios.get<PaginatedResponse<Contact>>(`/contacts?page=${page}&per_page=${perPage}&search=${search}`);
    return response.data;
  },

  create: async (data: { name: string; phone_number: string; description?: string }) => {
    const response = await axios.post<Contact>('/contacts', data);
    return response.data;
  },

  update: async (id: number, data: { name?: string; phone_number?: string; description?: string }) => {
    const response = await axios.put<Contact>(`/contacts/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await axios.delete(`/contacts/${id}`);
  },

  bulkDelete: async (ids: number[]) => {
    await axios.delete('/contacts/bulk', { data: { ids } });
  },

  bulkUpload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post('/contacts/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default contactService;
