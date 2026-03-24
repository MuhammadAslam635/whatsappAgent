import React, { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MessageSquare, Clock, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import chatService, { Conversation } from '@/api/chatService';

interface NotificationDropdownProps {
  onClose: () => void;
}

const NotificationDropdown: FC<NotificationDropdownProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [unreadConversations, setUnreadConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const data = await chatService.getUnreadConversations();
        setUnreadConversations(data);
      } catch (err) {
        console.error('Failed to fetch unread conversations', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUnread();
  }, []);

  const handleItemClick = (convId: number) => {
    navigate(`/dashboard/chat?id=${convId}`);
    onClose();
  };

  return (
    <div className="absolute top-full right-0 mt-3 w-80 md:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 z-[100] origin-top-right overflow-hidden">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-accent" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Recent Messages</h3>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-[9px] font-black text-accent uppercase">
          {unreadConversations.length} Unread
        </span>
      </div>

      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading...</span>
          </div>
        ) : unreadConversations.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <MessageSquare size={24} />
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">All caught up! No unread messages.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {unreadConversations.map((conv) => {
              const lastMsg = conv.messages?.[0];
              const time = conv.last_message_at ? formatDistanceToNow(new Date(conv.last_message_at)) + ' ago' : '';
              
              return (
                <button
                  key={conv.id}
                  onClick={() => handleItemClick(conv.id)}
                  className="w-full h-full p-4 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border-b border-slate-50 dark:border-slate-800/30 last:border-0 group text-left"
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center text-accent border border-accent/10">
                      <User size={20} />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-black text-white">
                      {conv.unread_count}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate pr-2 group-hover:text-accent transition-colors">
                        {conv.contact.name || conv.contact.phone_number}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 shrink-0 flex items-center gap-1 uppercase tracking-tighter">
                        <Clock size={10} />
                        {time}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 line-clamp-1 leading-snug">
                      {lastMsg ? (lastMsg.type === 'text' ? lastMsg.content : `[${lastMsg.type.toUpperCase()}] ${lastMsg.caption || ''}`) : 'No messages'}
                    </p>
                  </div>

                  <div className="shrink-0 self-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <ArrowRight size={14} className="text-accent" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {unreadConversations.length > 0 && (
        <button
          onClick={() => { navigate('/dashboard/chat'); onClose(); }}
          className="w-full p-4 bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-black text-slate-400 hover:text-accent uppercase tracking-widest transition-colors flex items-center justify-center gap-2 group border-t border-slate-100 dark:border-slate-800/50"
        >
          View All Conversations
          <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
        </button>
      )}
    </div>
  );
};

export default NotificationDropdown;
