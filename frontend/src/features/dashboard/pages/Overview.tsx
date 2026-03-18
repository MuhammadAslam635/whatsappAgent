import React, { memo } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import dashboardService, { DashboardStatsResponse } from '../../../api/dashboardService';

// Custom CSS for animations
const ChartAnimations = () => (
  <style>{`
    @keyframes bar-grow {
      from { height: 0; opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes pie-fill {
      from { stroke-dashoffset: 100.5; }
      to { stroke-dashoffset: var(--dash-offset); }
    }
    .animate-bar-grow {
      animation: bar-grow 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    .animate-pie-fill {
      transition: stroke-dashoffset 1.5s cubic-bezier(0.65, 0, 0.35, 1);
    }
  `}</style>
);

const StatCard: React.FC<{
  title: string;
  value: string;
  change?: string;
  label: string;
  type: string;
  chartData?: number[];
  dots?: number[];
  delay: string;
}> = memo(({ title, value, change, label, type, chartData, dots, delay }) => {
  return (
    <div className={`p-6 rounded-[32px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_12px_40px_0_rgba(31,38,135,0.08)] ring-1 ring-white/30 flex flex-col justify-between h-full min-h-[180px] transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 ${delay}`}>
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{title}</span>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="flex items-end justify-between gap-4 mt-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-emerald-500 dark:text-emerald-400">
            <span className="text-xs md:text-sm font-black tracking-tight">{change}</span>
          </div>
          <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tighter">{value}</span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1">{label}</span>
        </div>

        <div className="flex-1 h-10 flex items-end justify-end mb-2">
          {type === 'line' ? (
            <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <path
                d={`M0,35 Q10,${chartData?.[0] || 10} 20,30 T40,20 T60,35 T80,15 T100,25`}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="drop-shadow-[0_0_8px_var(--accent)] opacity-80"
                style={{ stroke: 'var(--accent)' }}
              />
            </svg>
          ) : (
            <div className="grid grid-cols-6 gap-1 opacity-60">
              {dots?.map((dot, i) => (
                <div
                  key={i}
                  className={`w-1 h-1 rounded-full ${dot === 0 ? 'bg-slate-300 dark:bg-white' : dot === 1 ? 'bg-accent' : 'bg-slate-200 dark:bg-slate-700'}`}
                  style={dot === 1 ? { backgroundColor: 'var(--accent)' } : {}}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const PieChartCard: React.FC<{ data: DashboardStatsResponse['delivery_status'] | null, delay: string }> = memo(({ data, delay }) => {
  const { t } = useTranslation();
  
  // Use data if available, fallback to 0/empty
  const hits = data?.hits || 0;
  const series = data?.series || [
    { label: 'Sent', value: 0 },
    { label: 'Delivered', value: 0 },
    { label: 'Failed', value: 0 },
    { label: 'Pending', value: 0 }
  ];

  // Percentages: Sent(75), Delivered(68), Remaining(15)
  // For visual representation in a full circle, we'll use:
  // Segment 1 (Delivered): 68%
  // Segment 2 (Remaining): 15%
  // Segment 3 (Other): 17% (Total is 100%)

  return (
    <div className={`p-6 rounded-[32px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_12px_40px_0_rgba(31,38,135,0.08)] ring-1 ring-white/30 h-full flex flex-col justify-between transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 ${delay}`}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{t('overview.message_status')}</span>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-28 h-28 md:w-32 md:h-32 flex items-center justify-center">
          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            {/* Background Ring */}
            <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="4.5" />

            {/* Delivered Segment (Base Accent) - 68% */}
            <circle
              cx="18" cy="18" r="16" fill="none"
              strokeWidth="4.5"
              strokeDasharray="100.5, 100"
              strokeDashoffset="100.5"
              strokeLinecap="round"
              className="animate-pie-fill"
              style={{
                stroke: 'var(--accent)',
                animation: 'pie-fill 1.2s ease-out 0.3s forwards',
                '--dash-offset': '32.5' // 100 - 67.5 (approx 68)
              } as any}
            />

            {/* Remaining Segment (Light Accent) - 15% starting at 68% */}
            <circle
              cx="18" cy="18" r="16" fill="none"
              strokeWidth="4.5"
              strokeDasharray="100.5, 100"
              strokeDashoffset="100.5"
              strokeLinecap="round"
              className="animate-pie-fill"
              style={{
                stroke: 'var(--accent)',
                strokeOpacity: 0.3,
                animation: 'pie-fill 1s ease-out 1s forwards',
                '--dash-offset': '85.5' // 100.5 - (100.5 * 0.15) = 85.425
              } as any}
              transform="rotate(244.8 18 18)" // 360 * 0.68 = 244.8
            />

            {/* Sent/Extra Segment (Mid Accent) - Pending/Failed combined for visual if needed */}
            <circle
              cx="18" cy="18" r="16" fill="none"
              strokeWidth="4.5"
              strokeDasharray="100.5, 100"
              strokeDashoffset="100.5"
              strokeLinecap="round"
              className="animate-pie-fill"
              style={{
                stroke: 'var(--accent)',
                strokeOpacity: 0.6,
                animation: 'pie-fill 0.8s ease-out 1.5s forwards',
                '--dash-offset': '83.5' // 100.5 - (100.5 * 0.17) = 83.415
              } as any}
              transform="rotate(298.8 18 18)" // 360 * 0.83 = 298.8
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-base font-black text-slate-900 dark:text-white leading-none">{hits}</span>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{t('overview.hits')}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {series.map((item, i) => (
            <div key={i} className="flex items-center gap-3 group">
              <div
                className="w-2.5 h-2.5 rounded-full shadow-sm group-hover:scale-125 transition-transform"
                style={{ backgroundColor: 'var(--accent)', opacity: i === 0 ? 0.6 : i === 1 ? 1 : 0.3 }}
              />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase leading-none tracking-wider">{t(`overview.${item.label.toLowerCase()}`)}</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{item.value}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const BarChartCard: React.FC<{ data: DashboardStatsResponse['message_timeline'] | null, delay: string }> = memo(({ data: chartData, delay }) => {
  const { t } = useTranslation();
  
  const total = chartData?.total || 0;
  const growth = chartData?.growth || '0%';
  const data = chartData?.data || [0,0,0,0,0,0,0];
  const labels = chartData?.labels || ['-6','-5','-4','-3','-2','-1','0'];
  
  // Calculate max for dynamic y-axis scaling
  const maxVal = Math.max(...data, 10); // at least 10
  const yAxisLabels = [maxVal, Math.floor(maxVal*0.8), Math.floor(maxVal*0.6), Math.floor(maxVal*0.4), Math.floor(maxVal*0.2), 0];

  // Helper to convert absolute count to percentage of max for the chart height
  const getPct = (val: number) => (val / maxVal) * 100;

  return (
    <div className={`p-8 rounded-[40px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_12px_40px_0_rgba(31,38,135,0.08)] ring-1 ring-white/30 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 ${delay}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{t('overview.total_delivered')}</span>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{total}</h2>
            <span className="text-xs font-bold text-emerald-500">{growth}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {['Week', 'Month', 'Year'].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${tab === 'Month' ? 'bg-white dark:bg-slate-700 text-accent shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                style={tab === 'Month' ? { color: 'var(--accent)' } : {}}
              >
                {t(`overview.${tab.toLowerCase()}`)}
              </button>
            ))}
          </div>
          <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      <div className="flex gap-4 h-80 relative">
        {/* Y Axis */}
        <div className="flex flex-col justify-between text-[10px] font-black text-slate-300 dark:text-slate-700 h-64 pr-2 font-mono">
          {yAxisLabels.map(label => <span key={label}>{label >= 1000 ? (label/1000).toFixed(1)+'k' : label}</span>)}
        </div>

        {/* Chart Content Area */}
        <div className="flex-1 flex flex-col h-full">
          <div className="flex-1 flex items-end justify-between gap-1 md:gap-3 relative">
            {/* Static Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              {yAxisLabels.map(label => (
                <div key={label} className="w-full border-t border-slate-200 dark:border-slate-700 h-px" />
              ))}
            </div>

            {/* Bars */}
            {data.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 group h-full justify-end relative z-10">
                <div className="w-full max-w-[40px] rounded-full bg-slate-50 dark:bg-slate-800/30 relative overflow-hidden h-full">
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-full bg-accent opacity-20 dark:opacity-30 group-hover:opacity-40 transition-opacity animate-bar-grow"
                    style={{
                      height: `${getPct(val)}%`,
                      backgroundColor: 'var(--accent)',
                      animationDelay: `${i * 0.05}s`
                    }}
                  />
                  <div
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_12px_var(--accent)] group-hover:scale-150 transition-transform animate-bar-grow"
                    style={{
                      bottom: `calc(${getPct(val)}% - 12px)`,
                      backgroundColor: 'var(--accent)',
                      animationDelay: `${i * 0.05}s`
                    }}
                  />
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-full bg-accent shadow-[0_0_20px_var(--accent)] animate-bar-grow"
                    style={{
                      height: `${getPct(val) * 0.7}%`,
                      backgroundColor: 'var(--accent)',
                      animationDelay: `${i * 0.05}s`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* X Axis Labels */}
          <div className="mt-4 flex items-center justify-between pl-0 md:pl-0.5">
            <div className="flex-1 flex justify-between gap-1 md:gap-3">
              {labels.map((label, i) => (
                <span key={i} className="flex-1 text-center text-[9px] font-black text-slate-400 dark:text-slate-500 font-mono">
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-2 text-center">
            <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest font-mono">{t('overview.date_axis')}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

const Overview: React.FC = memo(() => {
  const { t } = useTranslation();
  const [data, setData] = React.useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        const stats = await dashboardService.getStats();
        if (mounted) {
          setData(stats);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
        if (mounted) setLoading(false);
      }
    };
    fetchStats();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-4 md:space-y-6">
      <ChartAnimations />
      {/* Top Row: 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* Connected Numbers Stat Card */}
        <StatCard
          title={t(`stats.connected_numbers`)}
          value={loading ? '...' : String(data?.stats.connected_numbers || 0)}
          change="+0%" // Mock dynamic change for now
          label={t(`stats.active_instances`)}
          type="line"
          chartData={[10, 20, 15, 30, 25, 40, 35]}
          delay="delay-0"
        />

        {/* Total Contacts Stat Card */}
        <StatCard
          title={t(`stats.total_contacts`)}
          value={loading ? '...' : String(data?.stats.total_contacts || 0)}
          change="+0%" // Mock dynamic change for now
          label={t(`stats.synced_numbers`)}
          type="dots"
          dots={[0, 1, 0, 1, 1, 0]}
          delay="delay-150"
        />
        
        {/* Delivery Pie Chart */}
        {loading ? (
             <div className="p-6 rounded-[32px] bg-slate-100 dark:bg-slate-800/50 animate-pulse h-full min-h-[180px]"></div>
        ) : (
            <PieChartCard data={data?.delivery_status || null} delay="delay-300" />
        )}
      </div>

      {/* Bottom Row: Full-width Bar Chart */}
      <div className="w-full">
        {loading ? (
             <div className="p-8 rounded-[40px] bg-slate-100 dark:bg-slate-800/50 animate-pulse h-80 w-full mt-6"></div>
        ) : (
             <BarChartCard data={data?.message_timeline || null} delay="delay-500" />
        )}
      </div>
    </div>
  );
});

Overview.displayName = 'Overview';

export default Overview;
