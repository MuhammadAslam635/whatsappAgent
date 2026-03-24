import React, { memo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BrainCircuit, UploadCloud, Trash2, Bot, Save, FileText, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '../../../store/ToastContext';
import { 
    getBotSettings, 
    updateBotSettings, 
    getDocuments, 
    uploadDocument, 
    deleteDocument, 
    BotSettings, 
    DocumentInfo 
} from '../../../api/aiService';

const KnowledgeBaseSettings: React.FC = memo(() => {
    const { t } = useTranslation();
    const { toast } = useToast();
    
    // State
    const [botActive, setBotActive] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [documents, setDocuments] = useState<DocumentInfo[]>([]);
    
    // Loading states
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [loadingDocs, setLoadingDocs] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deletingDoc, setDeletingDoc] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Load
    useEffect(() => {
        let mounted = true;
        
        const fetchData = async () => {
            try {
                const [settings, docs] = await Promise.all([
                    getBotSettings(),
                    getDocuments()
                ]);
                
                if (mounted) {
                    setBotActive(settings.bot_active);
                    setPrompt(settings.bot_system_prompt || '');
                    setDocuments(docs);
                }
            } catch (error) {
                console.error("Failed to load AI data", error);
                if (mounted) toast("Failed to load AI settings.", 'error');
            } finally {
                if (mounted) {
                    setLoadingSettings(false);
                    setLoadingDocs(false);
                }
            }
        };

        fetchData();
        return () => { mounted = false; };
    }, [toast]);

    // Handlers
    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            await updateBotSettings({ bot_active: botActive, bot_system_prompt: prompt });
            toast("Bot settings saved successfully!", 'success');
        } catch (error) {
            console.error("Save failed", error);
            toast("Failed to save settings.", 'error');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast("Only PDF files are supported.", 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast("File size must be less than 10MB.", 'error');
            return;
        }

        setUploading(true);
        try {
            await uploadDocument(file);
            toast("Document successfully processed and added to Knowledge Base!", 'success');
            
            // Refresh document list
            const newDocs = await getDocuments();
            setDocuments(newDocs);
        } catch (error: any) {
            console.error("Upload failed", error);
            toast(error?.response?.data?.message || "Failed to upload document.", 'error');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteDoc = async (name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}" from the Knowledge Base? The AI will no longer know this information.`)) return;

        setDeletingDoc(name);
        try {
            await deleteDocument(name);
            setDocuments(prev => prev.filter(d => d.document_name !== name));
            toast("Document deleted.", 'success');
        } catch (error) {
            console.error("Delete failed", error);
            toast("Failed to delete document.", 'error');
        } finally {
            setDeletingDoc(null);
        }
    };

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-500 overflow-hidden pr-2">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-2 shrink-0 mb-4">
                <div>
                    <h1 className="text-lg md:text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                        <BrainCircuit size={24} className="text-accent md:w-8 md:h-8" />

                        AI Bot
                    </h1>

                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 font-medium text-xs md:text-sm">
                        Manage your RAG Knowledge Base and configure bot behavior.
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 md:gap-4 flex-1 min-h-0">

                {/* Left Column: Settings */}
                <div className="col-span-1 lg:col-span-5 flex flex-col gap-3 md:gap-4 overflow-y-auto pr-1">
                    <div className="p-3 md:p-6 rounded-2xl md:rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_4px_20px_0_rgba(31,38,135,0.06)] ring-1 ring-white/30">

                        <div className="flex items-center justify-between mb-3 md:mb-4">
                            <h2 className="text-sm md:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Bot size={16} className="text-accent md:w-5 md:h-5" />
                                Config
                            </h2>

                        </div>

                        
                        {loadingSettings ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="w-8 h-8 animate-spin text-accent" />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Toggle */}
                                <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between w-full">
                                        <h3 className="text-[11px] md:text-sm font-bold text-slate-800 dark:text-white">Enable Bot</h3>
                                        <label className="relative inline-flex items-center cursor-pointer shrink-0 scale-75 md:scale-100">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                checked={botActive}
                                                onChange={(e) => setBotActive(e.target.checked)}
                                            />
                                            <div className="w-12 h-6 md:w-14 md:h-7 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 md:after:h-6 md:after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-accent shadow-inner"></div>
                                        </label>
                                    </div>
                                    <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">
                                        AI will reply to WhatsApp using knowledge base.
                                    </p>
                                </div>


                                {/* System Prompt */}
                                <div className="space-y-1.5 md:space-y-2">
                                    <label className="block text-[11px] md:text-sm font-bold text-slate-700 dark:text-slate-300">
                                        System Prompt
                                    </label>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="e.g. Chat bot..."
                                        rows={2}
                                        className="w-full px-2 py-1.5 text-[10px] md:text-sm rounded-lg md:rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent dark:text-white transition-all resize-none"
                                    />
                                </div>


                                <button
                                    onClick={handleSaveSettings}
                                    disabled={savingSettings}
                                    className="w-full h-8 md:h-10 flex items-center justify-center gap-2 bg-accent text-white text-[11px] md:text-sm font-bold rounded-lg md:rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {savingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                                    Save
                                </button>

                            </div>
                        )}
                    </div>

                    {/* How it works info */}
                    <div className="p-4 rounded-3xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                        <h3 className="text-xs font-bold text-blue-800 dark:text-blue-400 flex items-center gap-1.5 mb-1.5">
                            <AlertCircle className="w-3.5 h-3.5" /> How it works
                        </h3>
                        <p className="text-[11px] text-blue-600 dark:text-blue-300/80 leading-relaxed">
                            Upload your business PDFs (FAQ, return policies, product info). The Neural Network instantly chunks and embeds them into the Vector DB. When a user asks a question on WhatsApp, the bot searches this database to provide an accurate, context-aware answer.
                        </p>
                    </div>
                </div>

                {/* Right Column: Knowledge Base */}
                <div className="col-span-1 lg:col-span-7">
                    <div className="p-3 md:p-6 rounded-2xl md:rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_4px_20px_0_rgba(31,38,135,0.06)] ring-1 ring-white/30 h-full flex flex-col">

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                            <div>
                                <h2 className="text-sm md:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <FileText size={16} className="text-accent md:w-5 md:h-5" />
                                    Docs
                                </h2>


                                <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {documents.length} Loaded into AI memory.
                                </p>

                            </div>

                            {/* Upload Button */}
                            <input 
                                type="file" 
                                accept=".pdf" 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="shrink-0 h-7 md:h-9 px-2 md:px-3 flex items-center gap-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] md:text-sm font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                                {uploading ? '...' : 'Upload'}
                            </button>

                        </div>

                        {/* Document List - Scrollable */}
                        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3">
                            {loadingDocs ? (
                                <div className="flex items-center justify-center h-40">
                                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                                </div>
                            ) : documents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 text-center px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                                    <UploadCloud className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                                    <p className="text-slate-500 dark:text-slate-400 font-medium font-mono text-sm max-w-[200px]">
                                        Knowledge Base Empty
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {documents.map((doc, idx) => (
                                        <div 
                                            key={idx} 
                                            className="group flex flex-col p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/50 transition-colors gap-2"
                                        >
                                            <div className="flex items-start gap-2 overflow-hidden w-full">
                                                <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                                                    <FileText className="w-3 h-3 md:w-4 md:h-4 text-accent" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-[11px] md:text-sm font-bold text-slate-800 dark:text-white truncate" title={doc.document_name}>
                                                        {doc.document_name}
                                                    </h4>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-1">

                                                <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-slate-500 font-mono">
                                                    <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                                    <span className="text-accent/80 font-black">{doc.chunks} Chunk</span>
                                                </div>

                                                <button
                                                    onClick={() => handleDeleteDoc(doc.document_name)}
                                                    disabled={deletingDoc === doc.document_name}
                                                    className="shrink-0 w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white dark:bg-red-500/10 dark:hover:bg-red-500 dark:hover:text-white transition-colors disabled:opacity-50"
                                                >
                                                    {deletingDoc === doc.document_name ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                                                </button>
                                            </div>
                                        </div>

                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

KnowledgeBaseSettings.displayName = 'KnowledgeBaseSettings';

export default KnowledgeBaseSettings;
