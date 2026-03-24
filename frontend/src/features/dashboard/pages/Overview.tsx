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
    <div className={`p-6 rounded-[32px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm flex flex-col justify-between h-full min-h-[160px] transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 ${delay}`}>
      <div className="flex justify-between items-start">
        <span className="text-[7px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{title}</span>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
          <MoreHorizontal size={12} className="md:w-[14px] md:h-[14px]" />
        </button>
      </div>




      <div className="flex items-end justify-between gap-4 mt-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-emerald-500 dark:text-emerald-400">
            <span className="text-[8px] md:text-[10px] font-black tracking-tight">{change}</span>
          </div>
          <span className="text-lg md:text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tighter">{value}</span>
          <span className="text-[7px] md:text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 md:mt-2">{label}</span>
        </div>


        <div className="flex-1 h-14 flex items-end justify-end mb-1">


          {type === 'line' ? (
            <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <path
                d={`M0,35 Q10,${chartData?.[0] || 10} 20,30 T40,20 T60,35 T80,15 T100,25`}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="opacity-80"
                style={{ stroke: 'var(--accent)' }}
              />
            </svg>
          ) : (
            <div className="grid grid-cols-6 gap-0.5 opacity-60">
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
  if (!data) return null;

  const hits = data.hits || 0;
  const series = data.series || [];

  return (
    <div className={`p-6 rounded-[32px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 ${delay}`}>
      <div className="flex justify-between items-start mb-2 md:mb-4">
        <span className="text-[7px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('overview.message_status')}</span>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
          <MoreHorizontal size={12} className="md:w-[14px] md:h-[14px]" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6">
        <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">



          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="4.5" className="text-slate-100 dark:text-slate-800" />
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
                '--dash-offset': `${100 - (series[0]?.value || 0)}`
              } as any}

            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-sm md:text-lg font-black text-slate-900 dark:text-white leading-none">{hits}</span>
            <span className="text-[7px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('overview.hits')}</span>
          </div>


        </div>

        <div className="flex flex-col gap-2.5 flex-1">
          {series.map((item, i) => (
            <div key={i} className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full"
                  style={{ backgroundColor: 'var(--accent)', opacity: item.label === 'Delivered' ? 1 : item.label === 'Pending' ? 0.6 : 0.3 }}
                />
                <span className="text-[7px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase leading-none tracking-tight">{t(`overview.${item.label.toLowerCase()}`)}</span>
              </div>
              <span className="text-[8px] md:text-[10px] font-black text-slate-900 dark:text-white">{item.value}%</span>


            </div>
          ))}
        </div>
      </div>
    </div>

  );
});


const InteractionVolumeCard: React.FC<{ data: DashboardStatsResponse['interaction_volume'] | null, delay: string }> = memo(({ data, delay }) => {
  const { t } = useTranslation();
  if (!data) return null;

  const maxVal = Math.max(...data.incoming, ...data.outgoing, 10);
  const getPct = (val: number) => (val / maxVal) * 100;

  return (
    <div className={`p-6 rounded-[32px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 ${delay}`}>
      <div className="flex justify-between items-start mb-6">
        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('overview.interaction_volume')}</span>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" style={{ backgroundColor: 'var(--accent)' }} />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{t('overview.outgoing')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{t('overview.incoming')}</span>
          </div>
        </div>
      </div>


      <div className="flex items-end justify-between gap-3 h-64">

        {data.labels.map((label, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
            <div className="flex items-end gap-1 h-48 w-full justify-center">
              <div 
                className="w-3 md:w-5 rounded-t-md bg-slate-200 dark:bg-slate-700 transition-all duration-700"
                style={{ height: `${getPct(data.incoming[i])}%` }}
              />
              <div 
                className="w-3 md:w-5 rounded-t-md bg-accent transition-all duration-700"
                style={{ height: `${getPct(data.outgoing[i])}%`, backgroundColor: 'var(--accent)' }}
              />
            </div>
            <span className="text-[9px] font-black text-slate-400 font-mono mt-1">{label}</span>


          </div>
        ))}
      </div>
    </div>
  );
});

const BulkPerformanceCard: React.FC<{ data: DashboardStatsResponse['bulk_performance'] | null, delay: string }> = memo(({ data, delay }) => {
  const { t } = useTranslation();
  if (!data) return null;

  const maxVal = Math.max(...data.sent, ...data.delivered, ...data.read, ...data.failed, 10);
  const getPct = (val: number) => (val / maxVal) * 100;

  return (
    <div className={`p-6 rounded-[32px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 ${delay}`}>
      <div className="flex justify-between items-start mb-6">
        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('overview.bulk_performance')}</span>

        <div className="flex gap-2">
           {['sent', 'delivered', 'read', 'failed'].map(status => (
             <div key={status} className="flex items-center gap-1">
               <div className={`w-2 h-2 rounded-full ${status === 'failed' ? 'bg-rose-500' : 'bg-accent'}`} style={status !== 'failed' ? { backgroundColor: 'var(--accent)', opacity: status === 'read' ? 1 : status === 'delivered' ? 0.6 : 0.3 } : {}} />
             </div>
           ))}
        </div>
      </div>

      <div className="relative h-64 w-full px-2">

        <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <path
            d={`M ${data.labels.map((_, i) => `${(i / (data.labels.length - 1)) * 100},${50 - (getPct(data.read[i]) / 2)}`).join(' L ')}`}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d={`M ${data.labels.map((_, i) => `${(i / (data.labels.length - 1)) * 100},${50 - (getPct(data.delivered[i]) / 2)}`).join(' L ')}`}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1"
            strokeLinecap="round"
            className="opacity-30"
          />
        </svg>
        <div className="absolute bottom-0 w-full flex justify-between mt-2 px-2">
           {data.labels.map((label, i) => (
             <span key={i} className="text-[9px] font-black text-slate-400 font-mono">{label}</span>
           ))}
        </div>


      </div>
    </div>
  );
});

const RangeSelector: React.FC<{ current: string; onChange: (range: string) => void }> = memo(({ current, onChange }) => {
  const { t } = useTranslation();
  const ranges = [
    { id: 'daily', label: t('overview.week') },
    { id: 'weekly', label: t('overview.month') }, 
    { id: 'monthly', label: '6 Months' },
    { id: 'yearly', label: t('overview.year') }
  ];

  return (
    <div className="flex items-center gap-3">
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl shadow-inner">
        {ranges.map((range) => (
          <button
            key={range.id}
            onClick={() => onChange(range.id)}
            className={`px-5 py-2.5 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
              current === range.id 
                ? 'bg-white dark:bg-slate-700 text-accent shadow-md' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
            style={current === range.id ? { color: 'var(--accent)' } : {}}

          >
            {range.label}
          </button>
        ))}
      </div>
    </div>

  );
});

const Overview: React.FC = memo(() => {
  const { t } = useTranslation();
  const [data, setData] = React.useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [range, setRange] = React.useState('daily');

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    const fetchStats = async () => {
      try {
        const stats = await dashboardService.getStats(range);
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
  }, [range]);

  return (
    <div className="space-y-8 pb-32">
      <ChartAnimations />
      
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{t('sidebar.overview')}</h1>
        <RangeSelector current={range} onChange={setRange} />
      </div>


      {/* Top Row: 3-Column Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">

        
        <StatCard
          title={t(`stats.connected_numbers`)}
          value={loading ? '...' : String(data?.stats.connected_numbers || 0)}
          change="+0%"
          label={t(`stats.active_instances`)}
          type="line"
          chartData={[10, 20, 15, 30, 25, 40, 35]}
          delay="delay-0"
        />

        <StatCard
          title={t(`stats.total_contacts`)}
          value={loading ? '...' : String(data?.stats.total_contacts || 0)}
          change="+0%"
          label={t(`stats.synced_numbers`)}
          type="dots"
          dots={[0, 1, 0, 1, 1, 0]}
          delay="delay-150"
        />
        
        {loading ? (
             <div className="p-6 rounded-[32px] bg-slate-100 dark:bg-slate-800/50 animate-pulse h-40"></div>
        ) : (
            <PieChartCard data={data?.delivery_status || null} delay="delay-300" />
        )}
      </div>

      {/* Bottom Row: 2-Column Grid */}
      <div className="grid grid-cols-2 gap-4 md:gap-8">

        {loading ? (
             <>
               <div className="p-6 rounded-[32px] bg-slate-100 dark:bg-slate-800/50 animate-pulse h-80 w-full"></div>
               <div className="p-6 rounded-[32px] bg-slate-100 dark:bg-slate-800/50 animate-pulse h-80 w-full"></div>
             </>
        ) : (
             <>
               <InteractionVolumeCard data={data?.interaction_volume || null} delay="delay-200" />
               <BulkPerformanceCard data={data?.bulk_performance || null} delay="delay-400" />
             </>
        )}
      </div>
    </div>

  );
});

Overview.displayName = 'Overview';

export default Overview;



