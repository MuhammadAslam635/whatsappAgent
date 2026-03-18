import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Send, Check, Users, User, Trash2, CheckCircle2, AlertCircle, Loader2, MessageSquare } from 'lucide-react';
import contactService, { Contact } from '@/api/contactService';
import chatService from '@/api/chatService';
import { useToast } from '@/store/ToastContext';
import { formatPhoneNumber } from '@/lib/utils';
import Button from '@/components/ui/Button/Button';

const BulkMessagePage: React.FC = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [search, setSearch] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [sendingProgress, setSendingProgress] = useState(0);
    const toast = useToast();

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const response = await contactService.getAll(1, 2000);
                setContacts(response.data);
            } catch (err) {
                toast.error('Failed to load contacts');
            } finally {
                setIsLoading(false);
            }
        };
        fetchContacts();
    }, [toast]);

    const filteredContacts = useMemo(() => {
        return contacts.filter(c => 
            c.name.toLowerCase().includes(search.toLowerCase()) || 
            c.phone_number.includes(search)
        );
    }, [contacts, search]);

    const toggleSelect = (id: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredContacts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredContacts.map(c => c.id)));
        }
    };

    const handleSend = async () => {
        const selectedArray = Array.from(selectedIds);
        const total = selectedArray.length;
        if (total === 0) {
            toast.error('Please select at least one contact');
            return;
        }
        if (!message.trim()) {
            toast.error('Please type a message');
            return;
        }

        setIsSending(true);
        setSendingProgress(0);
        
        let successCount = 0;
        let failCount = 0;

        try {
            if (total <= 5) {
                // Sequential for small batches
                for (let i = 0; i < total; i++) {
                    setSendingProgress(i + 1);
                    try {
                        await chatService.sendMessage(selectedArray[i], message.trim());
                        successCount++;
                    } catch (err) {
                        failCount++;
                    }
                }
            } else {
                // Batch processing (chunks of 5) for larger groups
                const CHUNK_SIZE = 5;
                for (let i = 0; i < total; i += CHUNK_SIZE) {
                    const chunk = selectedArray.slice(i, i + CHUNK_SIZE);
                    const currentProgress = Math.min(i + CHUNK_SIZE, total);
                    setSendingProgress(currentProgress);
                    
                    try {
                        const result = await chatService.bulkSend(chunk, message.trim());
                        successCount += result.results.success;
                        failCount += result.results.failed;
                    } catch (err) {
                        failCount += chunk.length;
                    }
                }
            }

            if (failCount === 0) {
                toast.success(`Broadcasting complete! Successfully sent to ${successCount} people.`);
            } else {
                toast.success(`Broadcasting finished. Success: ${successCount}, Failed: ${failCount}`);
            }
            
            setMessage('');
            setSelectedIds(new Set());
        } catch (err) {
            toast.error('An unexpected error occurred during broadcasting');
        } finally {
            setIsSending(false);
            setSendingProgress(0);
        }
    };

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, []);

    useEffect(() => {
        adjustHeight();
    }, [message, adjustHeight]);

    return (
        <div className="min-h-full flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-16 relative mt-2">
            {/* Background Decorative Elements */}
            <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-1 relative z-10">
                <div className="flex items-center gap-4">
                    <div 
                        className="p-3 rounded-2xl text-white shadow-lg transition-transform hover:scale-110 duration-500"
                        style={{ background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent), #fff 20%))' }}
                    >
                        <Send size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                            Broadcast Center
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-[2px] rounded-full bg-accent" style={{ backgroundColor: 'var(--accent)' }} />
                            <p className="text-slate-500 dark:text-slate-400 font-black uppercase text-[9px] tracking-[0.2em]">Operational Intelligence</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl px-5 py-2 rounded-[20px] border border-white/40 dark:border-white/10 shadow-md flex items-center gap-5 group transition-all hover:bg-white/60">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-70">Target Recipients</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xl font-black text-accent transition-all group-hover:scale-110" style={{ color: 'var(--accent)' }}>{selectedIds.size}</span>
                            <span className="text-xs font-bold text-slate-400">/ {contacts.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 relative z-10 items-start">
                {/* Left Panel: Contact Selection */}
                <div className="w-full lg:w-[340px] bg-white/70 dark:bg-[#111b21]/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/40 dark:border-slate-800/50 flex flex-col transition-all hover:shadow-accent/5 lg:sticky lg:top-6">
                    <div className="p-5 border-b border-slate-100/50 dark:border-slate-800/50 space-y-3.5 bg-slate-50/50 dark:bg-white/5">
                        <div className="relative group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors" style={{ color: search ? 'var(--accent)' : undefined }} size={16} />
                            <input 
                                type="text"
                                placeholder="Filter audience..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-3.5 py-3 bg-white dark:bg-[#202c33] border border-slate-200/50 dark:border-slate-700 rounded-xl text-[12px] font-bold focus:ring-4 focus:ring-accent/10 transition-all outline-none shadow-sm"
                            />
                        </div>
                        
                        <div className="flex items-center justify-between px-1">
                            <button 
                                onClick={toggleSelectAll}
                                className="text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                                style={{ color: 'var(--accent)' }}
                            >
                                <div 
                                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selectedIds.size === filteredContacts.length ? 'text-white' : 'border-slate-300'}`}
                                    style={selectedIds.size === filteredContacts.length ? { backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' } : {}}
                                >
                                    {selectedIds.size === filteredContacts.length && <Check size={10} strokeWidth={4} />}
                                </div>
                                {selectedIds.size === filteredContacts.length ? 'Clear Selection' : 'Select All'}
                            </button>
                            <span className="text-[9px] font-black text-slate-400/60 uppercase tracking-widest">
                                {filteredContacts.length} Profiles
                            </span>
                        </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2.5">
                        {isLoading ? (
                            <div className="flex flex-col gap-2 p-1.5">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="h-12 w-full bg-slate-100/50 dark:bg-slate-800/30 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : filteredContacts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-10 text-center space-y-3 opacity-20">
                                <Users size={40} className="text-slate-400" />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Silence in the lists</p>
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                {filteredContacts.map(contact => (
                                    <div 
                                        key={contact.id}
                                        onClick={() => toggleSelect(contact.id)}
                                        className={`group p-2 rounded-xl flex items-center gap-3 cursor-pointer transition-all duration-300 ${
                                            selectedIds.has(contact.id) 
                                                ? 'bg-accent/5 dark:bg-accent/10 shadow-inner' 
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                        }`}
                                    >
                                        <div 
                                            className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all ${
                                                selectedIds.has(contact.id) 
                                                    ? 'text-white scale-110 shadow-md shadow-accent/20' 
                                                    : 'border-slate-200 dark:border-slate-700'
                                            }`}
                                            style={selectedIds.has(contact.id) ? { backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' } : {}}
                                        >
                                            {selectedIds.has(contact.id) && <Check size={10} strokeWidth={4} />}
                                        </div>
                                        
                                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-black text-[11px] group-hover:rotate-12 transition-transform shadow-sm">
                                            {contact.name.charAt(0)}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-[12px] font-black tracking-tight truncate ${selectedIds.has(contact.id) ? 'text-accent' : 'text-slate-900 dark:text-white'}`} style={selectedIds.has(contact.id) ? { color: 'var(--accent)' } : {}}>
                                                {contact.name}
                                            </p>
                                            <p className="text-[9px] font-bold text-slate-400/80 truncate tracking-tighter">
                                                {formatPhoneNumber(contact.phone_number)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Message Composer */}
                <div className="flex-1 bg-white/70 dark:bg-[#111b21]/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/40 dark:border-slate-800/50 flex flex-col transition-all hover:shadow-accent/5">
                    <div className="p-5 bg-slate-50/30 dark:bg-white/5 border-b border-slate-100/50 dark:border-slate-800/50 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Compose Broadcast</h2>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }}/>
                                Secure Channel Active
                            </p>
                        </div>
                        <div 
                            className="p-2.5 rounded-xl text-white shadow-xl rotate-12"
                            style={{ background: 'var(--accent)' }}
                        >
                            <MessageSquare size={18} />
                        </div>
                    </div>

                    <div className="p-5 lg:p-6 flex flex-col gap-6">
                        <div className="relative group">
                            <div className="absolute top-3.5 right-4 z-10">
                                <span 
                                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${message.length > 0 ? 'bg-accent/10' : 'bg-slate-100 text-slate-400'}`}
                                    style={message.length > 0 ? { color: 'var(--accent)', backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)' } : {}}
                                >
                                    {message.length} Characters
                                </span>
                            </div>
                            <textarea 
                                ref={textareaRef}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Whisper your message..."
                                className="w-full p-6 lg:p-7 bg-white/50 dark:bg-[#202c33]/50 border border-slate-100 dark:border-slate-700/50 rounded-[24px] text-[16px] lg:text-[17px] leading-relaxed font-semibold focus:ring-[10px] focus:ring-accent/5 transition-all outline-none resize-none text-slate-900 dark:text-[#d1d7db] shadow-inner placeholder-slate-400 dark:placeholder-slate-500/50 min-h-[220px]"
                            />
                        </div>

                        <div className="pb-2">
                            <Button 
                                onClick={handleSend}
                                disabled={isSending || selectedIds.size === 0 || !message.trim()}
                                className="w-full h-14 lg:h-16 rounded-[18px] lg:rounded-[22px] text-lg font-black tracking-[0.15em] gap-4 shadow-xl relative overflow-hidden group transition-all active:scale-[0.98] border-none"
                                style={{ 
                                    background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent), #000 15%))',
                                    backgroundColor: 'var(--accent)',
                                    boxShadow: '0 15px 35px -10px color-mix(in srgb, var(--accent) 50%, transparent)'
                                }}
                            >
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                {isSending ? (
                                    <div className="flex items-center gap-3 relative z-10 text-white">
                                        <Loader2 className="animate-spin" size={24} />
                                        <span className="uppercase font-black text-xs lg:text-sm tracking-[0.25em]">Sending {sendingProgress}/{selectedIds.size}...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 relative z-10 text-white">
                                        <Send size={22} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500" />
                                        <span className="uppercase font-black text-xs lg:text-sm tracking-[0.15em]">Launch to {selectedIds.size} Profiles</span>
                                    </div>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Liquid Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                {[
                    { icon: CheckCircle2, label: 'Safety Protocols', text: 'Anti-spam active.', color: 'emerald' },
                    { icon: Users, label: 'Omni-Reach', text: '2k capacity.', color: 'accent' },
                    { icon: AlertCircle, label: 'Live Pulse', text: '100% operational.', color: 'amber' }
                ].map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-white/40 dark:bg-[#111b21]/50 backdrop-blur-xl border border-white/40 dark:border-white/5 flex items-center gap-3.5 transition-all hover:bg-white/60 dark:hover:bg-white/10 group shadow-md text-sm">
                        <div className={`p-2.5 rounded-xl shadow-sm transition-transform group-hover:scale-110 ${
                            item.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' : 
                            item.color === 'amber' ? 'bg-amber-500/10 text-amber-500' : 
                            'bg-accent/10 text-accent'
                        }`} style={item.color === 'accent' ? { backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' } : {}}>
                            <item.icon size={18} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5" style={{ color: item.color === 'emerald' ? '#10b981' : item.color === 'amber' ? '#f59e0b' : 'var(--accent)' }}>
                                {item.label}
                            </p>
                            <p className="text-[10px] font-bold text-slate-500/80 dark:text-slate-400/60 leading-tight mt-0.5">{item.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BulkMessagePage;
