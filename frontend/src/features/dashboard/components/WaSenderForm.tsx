import React, { memo, useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  ExternalLink, 
  Trash2, 
  Edit2, 
  Loader2, 
  AlertCircle,
  Copy,
  Link,
  ArrowRight
} from 'lucide-react';
import integrationService, { Integration } from '../../../api/integrationService';
import Button from '../../../components/ui/Button/Button';
import { useToast } from '../../../store/ToastContext';

interface WaSenderFormProps {
  onClose: () => void;
  integration?: Integration;
  onRefresh: () => void;
}

const WaSenderForm: React.FC<WaSenderFormProps> = memo(({ onClose, integration, onRefresh }) => {
  const [phoneNumber, setPhoneNumber] = useState(integration?.phone_number || '');
  const [apiKey, setApiKey] = useState(integration?.api_key || '');
  const [webhookSecret, setWebhookSecret] = useState(integration?.webhook_secret || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!integration);
  const { success: showSuccess, error: showError } = useToast();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (integration) {
          // Update
          await integrationService.update(integration.id, {
              type: 'wa_sender',
              phone_number: phoneNumber,
              api_key: apiKey,
              webhook_secret: webhookSecret
          });
      } else {
          // Create
          await integrationService.create({
              type: 'wa_sender',
              phone_number: phoneNumber,
              api_key: apiKey,
              webhook_secret: webhookSecret
          });
      }
      showSuccess('Integration connected successfully!');
      await onRefresh();
      setIsEditing(false);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to connect integration.');
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber, apiKey, webhookSecret, integration, onRefresh, showSuccess, showError]);

  const handleDelete = useCallback(async () => {
    if (!integration) return;
    if (!window.confirm('Are you sure you want to delete this integration?')) return;
    
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
  }, [integration, onRefresh, onClose]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copied to clipboard!');
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 min-h-[400px]">
      {/* Left Side: Form */}
      <div className="flex-1 space-y-6">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            {integration && !isEditing ? 'Connected Session' : 'Connect WaSender'}
          </h3>
          <p className="text-slate-500 text-xs font-medium">
            {integration && !isEditing ? 'Your WhatsApp session is active and ready.' : 'Enter your credentials to link your WhatsApp session.'}
          </p>
        </div>

        {integration && !isEditing ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500" size={20} />
              <div>
                <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Status: Connected</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">+{integration.phone_number}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Webhook URL</label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 group">
                <Link size={14} className="text-slate-400" />
                <code className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex-1 truncate">
                  {integration.webhook_url}
                </code>
                <button 
                  onClick={() => copyToClipboard(integration.webhook_url)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500"
                >
                  <Copy size={14} />
                </button>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-1 italic">
                * Paste this URL in your WaSender Dashboard &gt; Manage Webhook
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Webhook Secret</label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 group">
                <code className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex-1 truncate">
                  {integration.webhook_secret || '••••••••••••••••'}
                </code>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 rounded-xl h-11 text-xs font-black border-slate-200 dark:border-slate-700"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 size={14} /> Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 rounded-xl h-11 text-xs font-black border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                onClick={handleDelete}
              >
                <Trash2 size={14} /> Delete
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp Number</label>
              <input 
                type="text" 
                placeholder="e.g. 923094169184"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">API Access Token</label>
              <input 
                type="password" 
                placeholder="20af63..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Webhook Secret (Optional)</label>
              <input 
                type="password" 
                placeholder="Paste secret from WaSender..."
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1 font-medium italic">
                * Required for signature verification
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              {integration && (
                 <Button 
                    type="button"
                    variant="outline" 
                    className="flex-1 rounded-xl h-12 text-xs font-black border-slate-200 dark:border-slate-700"
                    onClick={() => setIsEditing(false)}
                >
                    Cancel
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-[2] rounded-xl h-12 text-xs font-black bg-accent text-white shadow-lg shadow-accent/20"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : (integration ? 'Update Connection' : 'Connect Session')}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Right Side: Instructions */}
      <div className="w-full md:w-64 space-y-6 md:border-l border-slate-100 dark:border-slate-800 md:pl-8">
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Setup Instructions</h4>
          
          <div className="space-y-5">
            {[
              { 
                step: '01', 
                text: 'Visit WaSender Dashboard and go to "Sessions".',
                link: 'https://wasenderapi.com/sessions'
              },
              { 
                step: '02', 
                text: 'Create a new session and Scan the QR Code.',
              },
              { 
                step: '03', 
                text: 'Copy the "API Access Token" from the Credentials tab.',
              },
              { 
                step: '04', 
                text: 'Enter your phone number & token here.',
              },
              { 
                step: '05', 
                text: 'In WaSender "Manage Webhook", copy the "Webhook Secret" and paste it above for Secure Signature Verification.',
              }
            ].map((s, i) => (
              <div key={i} className="flex gap-3 items-start group">
                <span className="text-[10px] font-black text-accent/40 group-hover:text-accent transition-colors" style={{ color: 'var(--accent)', opacity: 0.4 }}>{s.step}</span>
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                  {s.text}
                  {s.link && (
                    <a href={s.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent ml-1 underline decoration-accent/30 hover:decoration-accent transition-all">
                       Visit <ExternalLink size={10} />
                    </a>
                  )}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 leading-relaxed mb-3">
              Need more help? Check the official documentation for detailed guides.
            </p>
            <a 
              href="https://wasenderapi.com/api-docs" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-between group"
            >
              <span className="text-[10px] font-black text-accent uppercase tracking-wider">Full Docs</span>
              <ArrowRight size={12} className="text-accent group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
});

WaSenderForm.displayName = 'WaSenderForm';

export default WaSenderForm;
