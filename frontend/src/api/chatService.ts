import axios from '@/api/axios';

export interface Message {
  id: number;
  conversation_id: number;
  whatsapp_message_id: string | null;
  sender: 'user' | 'contact';
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  contact_id: number;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
  contact: {
    id: number;
    name: string;
    phone_number: string;
  };
  messages?: Message[];
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

const chatService = {
  getConversations: async (page = 1): Promise<PaginatedResponse<Conversation>> => {
    const response = await axios.get(`/conversations?page=${page}`);
    return response.data;
  },

  getMessages: async (conversationId: number, page = 1): Promise<PaginatedResponse<Message>> => {
    const response = await axios.get(`/conversations/${conversationId}/messages?page=${page}`);
    return response.data;
  },

  sendMessage: async (contactId: number, content: string, file?: File | null): Promise<Message> => {
    const formData = new FormData();
    formData.append('contact_id', contactId.toString());
    formData.append('content', content);
    if (file) {
      formData.append('attachment', file);
    }

    const response = await axios.post('/messages/send', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  bulkSend: async (contactIds: number[], content: string): Promise<{ message: string; results: { success: number; failed: number } }> => {
    const response = await axios.post('/messages/bulk-send', {
      contact_ids: contactIds,
      content,
    });
    return response.data;
  },
  
  markAsRead: async (conversationId: number): Promise<void> => {
    await axios.post(`/conversations/${conversationId}/read`);
  },
  
  clearMessages: async (conversationId: number): Promise<void> => {
    await axios.delete(`/conversations/${conversationId}/messages`);
  },

  deleteConversation: async (conversationId: number): Promise<void> => {
    await axios.delete(`/conversations/${conversationId}`);
  },
};

export default chatService;
