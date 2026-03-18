import axiosInstance from './axios';

export interface BotSettings {
    bot_active: boolean;
    bot_system_prompt: string | null;
}

export interface DocumentInfo {
    document_name: string;
    uploaded_at: string;
    chunks: number;
}

export const getBotSettings = async (): Promise<BotSettings> => {
    const response = await axiosInstance.get('/user/bot-settings');
    return response.data;
};

export const updateBotSettings = async (settings: BotSettings): Promise<BotSettings> => {
    const response = await axiosInstance.post('/user/bot-settings', settings);
    return response.data;
};

export const getDocuments = async (): Promise<DocumentInfo[]> => {
    const response = await axiosInstance.get('/documents');
    return response.data;
};

export const uploadDocument = async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // We override content-type for multipart
    const response = await axiosInstance.post('/documents/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const deleteDocument = async (name: string): Promise<any> => {
    const response = await axiosInstance.delete(`/documents/${encodeURIComponent(name)}`);
    return response.data;
};
