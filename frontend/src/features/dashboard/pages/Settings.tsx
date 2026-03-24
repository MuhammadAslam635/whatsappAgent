import React, { memo, useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import metaIcon from '../../../assets/meta.png';
import integrationService, { Integration } from '../../../api/integrationService';
import { useToast } from '../../../store/ToastContext';

const Modal = lazy(() => import('../../../components/ui/Modal/Modal'));
const WaSenderForm = lazy(() => import('../../dashboard/components/WaSenderForm'));
const MetaForm = lazy(() => import('../../dashboard/components/MetaForm'));

const WhatsAppIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const MetaIcon = ({ size = 24 }: { size?: number }) => (
  <img src={metaIcon} alt="Meta" style={{ width: size, height: size, objectFit: 'contain' }} />
);

const IntegrationCard: React.FC<{
  title: string;
  description: string;
  icon: any;
  features: string[];
  delay: string;
  onIntegrate: () => void;
  isConnected?: boolean;
  isDisabled?: boolean;
}> = memo(({ title, description, icon: Icon, features, delay, onIntegrate, isConnected, isDisabled }) => {
  const { t } = useTranslation();
  return (
    <div className={`p-5 rounded-[32px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.04)] transition-all duration-500 hover:scale-[1.01] group flex flex-col h-full animate-in fade-in slide-in-from-bottom-6 ${delay} ${isDisabled ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform duration-500" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
          <Icon size={24} />
        </div>
        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
            isConnected
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15'
            : isDisabled
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/15'
            : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/15'
        }`}>
          {isConnected ? 'Connected' : isDisabled ? 'Switch Required' : 'Available'}
        </div>
      </div>

      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-4 flex-grow">{description}</p>

      <div className="space-y-3 mb-6">
        <h4 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">{t('settings.features')}</h4>
        <div className="space-y-2">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {isDisabled ? (
        <div className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-black text-xs flex items-center justify-center gap-2">
          <AlertCircle size={14} /> Other integration active
        </div>
      ) : (
        <button
          onClick={onIntegrate}
          className="w-full py-3 rounded-xl bg-accent text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-accent/10 hover:shadow-accent/30 active:scale-[0.98] transition-all duration-300 group/btn"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <span>{isConnected ? 'Manage Connection' : t('settings.integrate_button')}</span>
          <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
        </button>
      )}
    </div>
  );
});

const Settings: React.FC = memo(() => {
  const { t } = useTranslation();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWaSenderModalOpen, setIsWaSenderModalOpen] = useState(false);
  const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);
  const { error: showError } = useToast();

  const fetchIntegrations = useCallback(async () => {
    try {
      const data = await integrationService.getAll();
      setIntegrations(data);
    } catch (error) {
      console.error('Failed to fetch integrations', error);
      showError('Failed to fetch integrations. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const waSenderIntegration = integrations.find(i => i.type === 'wa_sender');
  const metaIntegration = integrations.find(i => i.type === 'meta');

  // User can only have one type active
  const hasWaSender = !!waSenderIntegration;
  const hasMeta = !!metaIntegration;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <header className="space-y-2 px-4">
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-8 rounded-full bg-accent" style={{ backgroundColor: 'var(--accent)' }} />
          <span className="text-[9px] font-black text-accent uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
            Configurations
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
          {t('settings.title')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl font-medium leading-relaxed">
          {t('settings.subtitle')} Choose either WaSender API or Meta Cloud API to send and receive WhatsApp messages.
        </p>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-3">
          <Loader2 className="animate-spin text-accent" size={32} style={{ color: 'var(--accent)' }} />
          <p className="text-xs font-bold text-slate-400">Loading configurations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 px-4">
          <IntegrationCard
            title={t('settings.wa_send_title')}
            description={t('settings.wa_send_desc')}
            icon={WhatsAppIcon}
            features={t('settings.wa_features', { returnObjects: true }) as string[]}
            delay="delay-75"
            onIntegrate={() => setIsWaSenderModalOpen(true)}
            isConnected={hasWaSender}
            isDisabled={hasMeta}
          />
          <IntegrationCard
            title={t('settings.meta_business_title')}
            description={t('settings.meta_business_desc')}
            icon={MetaIcon}
            features={t('settings.meta_features', { returnObjects: true }) as string[]}
            delay="delay-150"
            onIntegrate={() => setIsMetaModalOpen(true)}
            isConnected={hasMeta}
            isDisabled={hasWaSender}
          />
        </div>
      )}

      <Suspense fallback={null}>
        <Modal
          isOpen={isWaSenderModalOpen}
          onClose={() => setIsWaSenderModalOpen(false)}
          title="WhatsApp Integration — WaSender"
          maxWidth="max-w-3xl"
        >
          <WaSenderForm
            onClose={() => setIsWaSenderModalOpen(false)}
            integration={waSenderIntegration}
            onRefresh={fetchIntegrations}
          />
        </Modal>

        <Modal
          isOpen={isMetaModalOpen}
          onClose={() => setIsMetaModalOpen(false)}
          title="WhatsApp Integration — Meta Cloud API"
          maxWidth="max-w-3xl"
        >
          <MetaForm
            onClose={() => setIsMetaModalOpen(false)}
            integration={metaIntegration}
            onRefresh={fetchIntegrations}
          />
        </Modal>
      </Suspense>
    </div>
  );
});

Settings.displayName = 'Settings';

export default Settings;
