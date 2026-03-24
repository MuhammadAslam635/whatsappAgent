import React, { memo, useEffect, useRef } from 'react';
import { Phone, Video, MoreVertical, Check, CheckCheck, Clock, User, AlertCircle, FileText, Image as ImageIcon, PlayCircle, Music } from 'lucide-react';

import { Message, Conversation } from '@/api/chatService';
import { format } from 'date-fns';
import { BASE_URL } from '@/api/endpoints';

interface ChatWindowProps {
  conversation?: Conversation;
  messages: Message[];
  isLoading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
  onClear: () => void;
  onDelete: () => void;
  onViewContact: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = memo(({
  conversation,
  messages,
  isLoading,
  onLoadMore,
  hasMore,
  onClear,
  onDelete,
  onViewContact
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/20 p-8 text-center space-y-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center text-accent animate-pulse" style={{ backgroundColor: 'rgb(var(--accent-rgb) / 0.1)' }}>
            <User size={48} />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-4 border-slate-50 dark:border-slate-950 flex items-center justify-center shadow-lg">
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
        </div>
        <div className="space-y-2 max-w-sm">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Select a conversation</h2>
          <p className="text-sm font-medium text-slate-400 leading-relaxed">
            Choose a contact from the list on the left to start messaging. Your conversations are end-to-end encrypted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#efeae2] dark:bg-[#0b141a] relative">
      {/* Chat Header */}
      <div className="p-3 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between z-30 shadow-sm border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-black shadow-lg shadow-accent/20" style={{ backgroundColor: 'var(--accent)' }}>
            {conversation.contact?.name?.charAt(0) || '?'}
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
              {conversation.contact?.name || 'Unknown'}
            </h3>
            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Online</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-slate-400 relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`hover:text-accent transition-colors p-2 rounded-full ${isMenuOpen ? 'bg-slate-200 dark:bg-slate-700 text-accent' : ''}`}
          >
            <MoreVertical size={18} />
          </button>

          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-[#233138] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); onViewContact(); }}
                className="w-full text-left px-4 py-3 text-[14px] text-slate-700 dark:text-[#d1d7db] hover:bg-[#f5f6f6] dark:hover:bg-[#182229] transition-colors flex items-center gap-3 active:bg-slate-200 dark:active:bg-slate-700"
              >
                <User size={18} className="text-slate-400" />
                <span>Contact info</span>
              </button>
              <div className="h-px bg-slate-100 dark:bg-[#2a3942] my-1 mx-2" />
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); onClear(); }}
                className="w-full text-left px-4 py-3 text-[14px] text-slate-700 dark:text-[#d1d7db] hover:bg-[#f5f6f6] dark:hover:bg-[#182229] transition-colors flex items-center gap-3 active:bg-slate-200 dark:active:bg-slate-700"
              >
                <Clock size={18} className="text-slate-400" />
                <span>Clear chat</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); onDelete(); }}
                className="w-full text-left px-4 py-3 text-[14px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-bold flex items-center gap-3 active:bg-red-100 dark:active:bg-red-900/40"
              >
                <AlertCircle size={18} className="text-red-500" />
                <span>Delete chat</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Message List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-10 space-y-2 scrollbar-hide relative"
      >
        <div 
          className="absolute inset-0 z-0 opacity-[0.06] pointer-events-none"
          style={{ 
            backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
            backgroundBlendMode: 'overlay'
          }}
        />
        
        <div className="relative z-10 w-full flex flex-col gap-2">
        {hasMore && (
          <button 
            onClick={onLoadMore}
            className="w-full py-2 text-xs font-bold text-slate-400 hover:text-accent transition-colors"
          >
            Load previous messages
          </button>
        )}

        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          const showDate = index === 0 || 
            format(new Date(msg.created_at), 'yyyy-MM-dd') !== format(new Date(messages[index-1].created_at), 'yyyy-MM-dd');

          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-6">
                  <span className="px-3 py-1 rounded-full bg-slate-200/50 dark:bg-slate-800/50 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] backdrop-blur-sm">
                    {format(new Date(msg.created_at), 'MMMM d, yyyy')}
                  </span>
                </div>
              )}
              
              {(() => {
                const resolvedMediaUrl = msg.media_url 
                  ? (msg.media_url.startsWith('http') ? msg.media_url : `${BASE_URL}${msg.media_url}`) 
                  : null;

                return (
                  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2 duration-200`}>
                    <div className={`max-w-[85%] md:max-w-[65%] relative px-3 py-1.5 shadow-sm transition-all duration-300 ${
                      isUser 
                        ? 'bg-accent text-white rounded-lg rounded-tr-none' 
                        : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-lg rounded-tl-none'
                    }`} style={isUser ? { backgroundColor: 'var(--accent)' } : {}}>
                      
                      {msg.type === 'image' && resolvedMediaUrl && (
                        <div className="mb-1.5 -mx-1 -mt-0.5 rounded-lg overflow-hidden border border-black/5 dark:border-white/5 bg-slate-100 dark:bg-slate-800">
                          <img 
                            src={resolvedMediaUrl} 
                            alt="Shared" 
                            className="w-full max-h-72 object-cover cursor-pointer hover:opacity-95 transition-opacity select-none" 
                            onClick={() => window.open(resolvedMediaUrl!, '_blank')} 
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      )}

                      {msg.type === 'video' && resolvedMediaUrl && (
                        <div className="mb-1.5 -mx-1 -mt-0.5 rounded-lg overflow-hidden border border-black/5 dark:border-white/5 bg-slate-100 dark:bg-slate-800">
                          <video src={resolvedMediaUrl} controls className="w-full max-h-72 object-cover" />
                        </div>
                      )}

                      {msg.type === 'audio' && resolvedMediaUrl && (
                        <div className="mb-2 py-1">
                           <audio src={resolvedMediaUrl} controls className="w-full h-8 scale-90 origin-left invert dark:invert-0 opacity-80" />
                        </div>
                      )}

                      {msg.type === 'document' && resolvedMediaUrl && (
                        <div className="mb-2 p-2 rounded-lg bg-black/5 dark:bg-white/5 flex items-center gap-3 border border-black/10 dark:border-white/10 min-w-[200px]">
                           <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                              <FileText size={20} /> 
                           </div>
                           <div className="flex-1 overflow-hidden">
                              <p className="text-xs font-bold truncate max-w-full">{msg.content || 'Document'}</p>
                              <a href={resolvedMediaUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-accent font-black uppercase hover:underline mt-0.5 block">Download File</a>
                           </div>
                        </div>
                      )}


                      {msg.type === 'sticker' && resolvedMediaUrl && (
                        <div className="mb-1.5 py-1 flex justify-center">
                          <img src={resolvedMediaUrl} alt="Sticker" className="w-32 h-32 object-contain" />
                        </div>
                      )}

                      {(msg.type === 'text' || (msg.type !== 'text' && msg.content && msg.content !== '[Media Message]')) && (
                        <p className="text-sm font-medium leading-relaxed break-words">
                          {msg.content}
                        </p>
                      )}

                        {isUser && (
                          <div className="flex items-center gap-0.5 mt-1">
                            <span className="text-[9px] font-bold uppercase tracking-tighter text-white/70">
                              {format(new Date(msg.created_at), 'HH:mm')}
                            </span>
                            <div className="ml-1 flex items-center">
                              {/* <span className="text-[7px] mr-1 opacity-50">{msg.status}</span> */}
                              {msg.status === 'pending' ? <Clock size={10} className="text-white/50" /> : 
                               msg.status === 'failed' ? <AlertCircle size={10} className="text-red-300" /> :
                               msg.status === 'sent' ? <Check size={10} className="text-white/70" /> : 
                               <CheckCheck 
                                 size={12} 
                                 className={msg.status === 'read' ? 'text-blue-300' : 'text-white/70'} 
                               />}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                );
              })()}
            </React.Fragment>
          );
        })}
        </div>
      </div>
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';

export default ChatWindow;
