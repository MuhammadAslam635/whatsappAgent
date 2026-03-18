import axios from '@/api/axios';

export interface DashboardStatsResponse {
  stats: {
    connected_numbers: number;
    total_contacts: number;
  };
  delivery_status: {
    hits: number;
    series: { label: string; value: number }[];
  };
  message_timeline: {
    total: number | string;
    growth: string;
    data: number[];
    labels: string[];
  };
}

const dashboardService = {
  getStats: async (): Promise<DashboardStatsResponse> => {
    const response = await axios.get<DashboardStatsResponse>('/dashboard/stats');
    return response.data;
  },
};

export default dashboardService;
