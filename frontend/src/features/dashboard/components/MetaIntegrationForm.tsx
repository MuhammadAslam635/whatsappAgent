import React, { memo, useState, useCallback } from 'react';
import { 
  CheckCircle2, 
  ExternalLink, 
  Trash2, 
  Edit2, 
  Loader2, 
  Copy,
  Link,
  ArrowRight,
  Shield,
  Smartphone,
  Globe,
  Key,
  FileText
} from 'lucide-react';

import integrationService, { Integration } from '../../../api/integrationService';
import Button from '../../../components/ui/Button/Button';
import { useToast } from '../../../store/ToastContext';

interface MetaIntegrationFormProps {
  onClose: () => void;
  integration?: Integration;
  onRefresh: () => void;
}

const MetaIntegrationForm: React.FC<MetaIntegrationFormProps> = memo(({ onClose, integration, onRefresh }) => {
  const [appId, setAppId] = useState(integration?.app_id || '');
  const [phoneNumberId, setPhoneNumberId] = useState(integration?.phone_number_id || '');
  const [wabaId, setWabaId] = useState(integration?.waba_id || '');
  const [accessToken, setAccessToken] = useState(integration?.api_key || '');
  const [verifyToken, setVerifyToken] = useState(integration?.webhook_secret || 'whatsapp_widget_verify');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!integration);
  const { success: showSuccess, error: showError } = useToast();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
        type: 'meta' as const,
        app_id: appId,
        phone_number_id: phoneNumberId,
        waba_id: wabaId,
        api_key: accessToken,
        webhook_secret: verifyToken
    };

    try {
      if (integration) {
          await integrationService.update(integration.id, payload);
      } else {
          await integrationService.create(payload);
      }
      showSuccess('Meta Integration connected successfully!');
      await onRefresh();
      setIsEditing(false);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to connect Meta integration.');
    } finally {
      setIsLoading(false);
    }
  }, [appId, phoneNumberId, wabaId, accessToken, verifyToken, integration, onRefresh, showSuccess, showError]);

  const handleDelete = useCallback(async () => {
    if (!integration) return;
    if (!window.confirm('Are you sure you want to delete this Meta integration?')) return;
    
    setIsLoading(true);
    try {
      await integrationService.delete(integration.id);
      showSuccess('Integration deleted successfully');
      onRefresh();
      onClose();
    } catch (err: any) {
      showError('Failed to delete integration.');
    } finally {
      setIsLoading(false);
    }
  }, [integration, onRefresh, onClose, showSuccess, showError]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copied to clipboard!');
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 min-h-[500px]">
      {/* Left Side: Form */}
      <div className="flex-1 space-y-6">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            {integration && !isEditing ? 'Meta Cloud API Connected' : 'Setup Meta Cloud API'}
          </h3>
          <p className="text-slate-500 text-xs font-medium">
            {integration && !isEditing ? 'Your Meta WhatsApp integration is active.' : 'Enter your WhatsApp Cloud API credentials below.'}
          </p>
        </div>

        {integration && !isEditing ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500" size={20} />
              <div>
                <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Status: Active</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">App ID: {integration.app_id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Phone ID</p>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{integration.phone_number_id}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">WABA ID</p>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{integration.waba_id}</p>
                </div>
            </div>


            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Webhook Callback URL</label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 group">
                <Link size={14} className="text-slate-400" />
                <code className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex-1 truncate">
                  {integration.webhook_url}
                </code>
                <button onClick={() => copyToClipboard(integration.webhook_url)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500">
                  <Copy size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Verify Token</label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 group">
                <Shield size={14} className="text-slate-400" />
                <code className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex-1 truncate">
                  {integration.webhook_secret}
                </code>
                <button onClick={() => copyToClipboard(integration.webhook_secret || '')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500">
                  <Copy size={14} />
                </button>
              </div>
            </div>


            <div className="flex gap-3 pt-4">
              <Button variant="outline" size="sm" className="flex-1 rounded-xl h-11 text-xs font-black" onClick={() => setIsEditing(true)}>
                <Edit2 size={14} /> Edit Configuration
              </Button>
              <Button variant="outline" size="sm" className="flex-1 rounded-xl h-11 text-xs font-black border-red-200 text-red-500 hover:bg-red-50" onClick={handleDelete}>
                <Trash2 size={14} /> Delete
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Meta App ID</label>
                    <div className="relative">
                        <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="1582..." value={appId} onChange={(e) => setAppId(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all" required />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">WABA ID</label>
                    <div className="relative">
                        <Smartphone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="1092..." value={wabaId} onChange={(e) => setWabaId(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all" required />
                    </div>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone Number ID</label>
                <input type="text" placeholder="1054..." value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all" required />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">System User Access Token</label>
              <div className="relative">
                <Key size={14} className="absolute left-4 top-4 text-slate-400" />
                <textarea 
                    rows={3}
                    placeholder="EAAO..." 
                    value={accessToken} 
                    onChange={(e) => setAccessToken(e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all resize-none" 
                    required 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Webhook Verify Token</label>
              <input type="text" value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all" required />
              <p className="text-[10px] text-slate-400 mt-1 font-medium italic">* Use this in Meta Dashboard &gt; Configuration &gt; Verify Token</p>
            </div>

            <div className="flex gap-3 pt-4">
              {integration && (
                 <Button type="button" variant="outline" className="flex-1 rounded-xl h-12 text-xs font-black" onClick={() => setIsEditing(false)}>Cancel</Button>
              )}
              <Button type="submit" disabled={isLoading} className="flex-[2] rounded-xl h-12 text-xs font-black bg-accent text-white shadow-lg shadow-accent/20" style={{ backgroundColor: 'var(--accent)' }}>
                {isLoading ? <Loader2 size={16} className="animate-spin text-white" /> : (integration ? 'Update Configuration' : 'Save Meta Configuration')}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Right Side: Step-by-Step Guide */}
      <div className="w-full md:w-80 space-y-6 md:border-l border-slate-100 dark:border-slate-800 md:pl-8">
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Meta Setup Guide</h4>
          
          <div className="space-y-4 overflow-y-auto max-h-[450px] pr-2 scrollbar-thin">
            {[
              { 
                step: '01', 
                title: 'Meta Developers',
                text: 'Go to Meta for Developers and create a "Business" type App.',
                link: 'https://developers.facebook.com/'
              },
              { 
                step: '02', 
                title: 'WhatsApp Product',
                text: 'Inside your App, click "Set Up" on the WhatsApp product.',
              },
              { 
                step: '03', 
                title: 'Phone Number',
                text: 'Go to Configuration/Getting Started and add a Phone Number to your WABA.',
              },
              { 
                step: '04', 
                title: 'System User Token',
                text: 'In Business Settings > System Users, create a user and generate a "Permanent" token with "whatsapp_business_messaging" scope.',
              },
              { 
                step: '05', 
                title: 'IDs & Tokens',
                text: 'Copy your App ID, Phone Number ID, and WABA ID from the WhatsApp dashboard.',
              },
              { 
                step: '06', 
                title: 'Webhook Setup',
                text: 'Under Configuration, set the Callback URL and Verify Token provided on the left.',
              }
            ].map((s, i) => (
              <div key={i} className="flex gap-3 items-start group relative pb-4">
                {i !== 5 && <div className="absolute left-[9px] top-6 bottom-0 w-px bg-slate-100 dark:bg-slate-800" />}
                <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center text-[9px] font-black text-accent z-10 shrink-0" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                    {s.step}
                </div>
                <div className="space-y-1">
                    <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">{s.title}</p>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                        {s.text}
                        {s.link && (
                            <a href={s.link} target="_blank" rel="noreferrer" className="text-accent ml-1 underline inline-flex items-center gap-0.5">
                                Open <ExternalLink size={8} />
                            </a>
                        )}
                    </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700">
            <h5 className="text-[10px] font-black text-slate-900 dark:text-white mb-2 uppercase tracking-widest">Pro Tip</h5>
            <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
              Always use a **System User** permanent token. Temporary tokens expire in 24 hours and will break your integration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

MetaIntegrationForm.displayName = 'MetaIntegrationForm';

export default MetaIntegrationForm;
