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
  interaction_volume: {
    incoming: number[];
    outgoing: number[];
    labels: string[];
  };
  bulk_performance: {
    sent: number[];
    delivered: number[];
    read: number[];
    failed: number[];
    labels: string[];
  };
  overall_total: number;

}

const dashboardService = {
  getStats: async (range: string = 'daily'): Promise<DashboardStatsResponse> => {
    const response = await axios.get<DashboardStatsResponse>('/dashboard/stats', {
      params: { range },
    });
    return response.data;
  },

};

export default dashboardService;
