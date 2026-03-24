import React, { memo, useState, useCallback } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Trash2,
  Edit2,
  Loader2,
  Copy,
  Link,
  ArrowRight
} from 'lucide-react';
import integrationService, { Integration } from '../../../api/integrationService';
import Button from '../../../components/ui/Button/Button';
import { useToast } from '../../../store/ToastContext';

interface MetaFormProps {
  onClose: () => void;
  integration?: Integration;
  onRefresh: () => void;
}

const MetaForm: React.FC<MetaFormProps> = memo(({ onClose, integration, onRefresh }) => {
  const [phoneNumber, setPhoneNumber] = useState(integration?.phone_number || '');
  const [phoneNumberId, setPhoneNumberId] = useState(integration?.meta_phone_number_id || '');
  const [accessToken, setAccessToken] = useState('');
  const [wabaId, setWabaId] = useState(integration?.meta_waba_id || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!integration);
  const { success: showSuccess, error: showError } = useToast();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data: Partial<Integration> = {
        type: 'meta',
        phone_number: phoneNumber,
        meta_phone_number_id: phoneNumberId,
        meta_access_token: accessToken,
        meta_waba_id: wabaId || undefined,
      };

      if (integration) {
        await integrationService.update(integration.id, data);
      } else {
        await integrationService.create(data);
      }
      showSuccess('Meta WhatsApp integration connected successfully!');
      await onRefresh();
      setIsEditing(false);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to connect Meta integration.');
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber, phoneNumberId, accessToken, wabaId, integration, onRefresh, showSuccess, showError]);

  const handleDelete = useCallback(async () => {
    if (!integration) return;
    if (!window.confirm('Are you sure you want to delete this Meta integration?')) return;

    setIsLoading(true);
    try {
      await integrationService.delete(integration.id);
      showSuccess('Meta integration deleted successfully');
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
    <div className="flex flex-col md:flex-row gap-8 min-h-[400px]">
      <div className="flex-1 space-y-6">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            {integration && !isEditing ? 'Meta Connected' : 'Connect Meta WhatsApp'}
          </h3>
          <p className="text-slate-500 text-xs font-medium">
            {integration && !isEditing
              ? 'Your Meta Cloud API integration is active.'
              : 'Enter your Meta Developer credentials to connect.'}
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Webhook URL</label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
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
                * Paste this URL in your Meta App Dashboard &gt; WhatsApp &gt; Configuration &gt; Webhook URL
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number ID</label>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <code className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{integration.meta_phone_number_id}</code>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" size="sm" className="flex-1 rounded-xl h-11 text-xs font-black border-slate-200 dark:border-slate-700" onClick={() => setIsEditing(true)}>
                <Edit2 size={14} /> Edit
              </Button>
              <Button variant="outline" size="sm" className="flex-1 rounded-xl h-11 text-xs font-black border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={handleDelete}>
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
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone Number ID</label>
              <input
                type="text"
                placeholder="e.g. 123456789012345"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                required
              />
              <p className="text-[10px] text-slate-400 font-medium italic">
                Found in Meta Developer &gt; WhatsApp &gt; API Setup &gt; Phone Number ID
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Permanent Access Token</label>
              <input
                type="password"
                placeholder="EAAxxxxxxx..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                required
              />
              <p className="text-[10px] text-slate-400 font-medium italic">
                Generate a permanent token from Meta Business Settings &gt; System Users
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">WABA ID (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 109876543210"
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
              />
            </div>

            <div className="flex gap-3 pt-4">
              {integration && (
                <Button type="button" variant="outline" className="flex-1 rounded-xl h-12 text-xs font-black border-slate-200 dark:border-slate-700" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-[2] rounded-xl h-12 text-xs font-black bg-accent text-white shadow-lg shadow-accent/20"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : (integration ? 'Update Connection' : 'Connect Meta')}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Right Side: Instructions */}
      <div className="w-full md:w-64 space-y-6 md:border-l border-slate-100 dark:border-slate-800 md:pl-8">
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">What You Need</h4>

          <div className="space-y-4">
            {[
              {
                label: 'Phone Number ID',
                desc: 'Your WhatsApp phone number ID from the Meta API Setup page.',
              },
              {
                label: 'Access Token',
                desc: 'A permanent access token generated from Meta Business Settings > System Users.',
              },
              {
                label: 'Webhook URL',
                desc: 'After connecting, copy the webhook URL and paste it in Meta App > WhatsApp > Configuration.',
              },
              {
                label: 'Webhook Verify Token',
                desc: 'Set META_WEBHOOK_VERIFY_TOKEN in your server .env and use the same value in Meta webhook config.',
              },
              {
                label: 'Subscribe to Messages',
                desc: 'In Meta webhook config, subscribe to the "messages" field to receive incoming messages.',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 items-start group">
                <span className="text-[10px] font-black text-accent/40 group-hover:text-accent transition-colors" style={{ color: 'var(--accent)', opacity: 0.4 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="text-[11px] font-black text-slate-700 dark:text-slate-300">{item.label}</p>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 leading-relaxed mb-3">
              Need help? Check the official Meta Cloud API documentation.
            </p>
            <a
              href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between group"
            >
              <span className="text-[10px] font-black text-accent uppercase tracking-wider">Meta Docs</span>
              <ArrowRight size={12} className="text-accent group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
});

MetaForm.displayName = 'MetaForm';

export default MetaForm;
