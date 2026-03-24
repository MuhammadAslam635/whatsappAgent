import React, { memo } from 'react';
import { Search, User, Check, CheckCheck, Clock, MoreVertical } from 'lucide-react';
import { Conversation } from '@/api/chatService';
import { formatDistanceToNow } from 'date-fns';
import { formatPhoneNumber } from '@/lib/utils';

interface ChatSidebarProps {
  conversations: Conversation[];
  selectedId?: number;
  onSelect: (id: number) => void;
  search: string;
  onSearchChange: (search: string) => void;
  isLoading: boolean;
  onNewChat: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = memo(({
  conversations,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  isLoading,
  onNewChat
}) => {
  const [filter, setFilter] = React.useState<'all' | 'unread'>('all');

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21] border-r border-[#e9edef] dark:border-[#202c33]">
      {/* Sidebar Header */}
      <div className="bg-[#f0f2f5] dark:bg-[#202c33] px-4 py-3 flex items-center justify-between">
        <h1 className="text-[22px] font-bold text-slate-900 dark:text-[#d1d7db]">WhatsApp</h1>
        <div className="flex items-center gap-6 text-[#54656f] dark:text-[#aebac1]">
          <button 
            onClick={onNewChat}
            className="hover:bg-black/5 dark:hover:bg-white/5 p-2 rounded-full transition-colors" 
            title="New chat"
          >
            <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" className="" version="1.1" x="0px" y="0px" enableBackground="new 0 0 24 24"><path fill="currentColor" d="M19.005,3.175H4.674C3.642,3.175,2.8,4.017,2.8,5.049l0.009,14.332c0,1.032,0.842,1.874,1.874,1.874h14.322 c1.032,0,1.874-0.842,1.874-1.874V5.049C20.879,4.017,20.037,3.175,19.005,3.175z M16.426,13.62h-2.583v2.583h-1.685v-2.583H9.574 v-1.685h2.583V9.352h1.685v2.583h2.583V13.62z"></path></svg>
          </button>
          <button className="hover:bg-black/5 dark:hover:bg-white/5 p-2 rounded-full transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-2 space-y-2 border-b border-[#f0f2f5] dark:border-[#202c33]">
        <div className="relative flex items-center bg-[#f0f2f5] dark:bg-[#202c33] rounded-lg px-3 group">
          <Search className="text-[#54656f] dark:text-[#aebac1] mr-3" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search or start a new chat"
            className="flex-1 py-1.5 bg-transparent border-none text-[15px] focus:ring-0 outline-none text-[#111b21] dark:text-[#e9edef] placeholder:text-[#54656f] dark:placeholder:text-[#aebac1]"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 px-1 py-1 overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              filter === 'all' 
                ? 'bg-accent text-white shadow-sm' 
                : 'bg-[#f0f2f5] dark:bg-[#202c33] text-[#54656f] dark:text-[#aebac1] hover:bg-[#dfe5e7] dark:hover:bg-[#2a3942]'
            }`}
            style={filter === 'all' ? { backgroundColor: 'var(--accent)' } : {}}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              filter === 'unread' 
                ? 'bg-accent text-white shadow-sm' 
                : 'bg-[#f0f2f5] dark:bg-[#202c33] text-[#54656f] dark:text-[#aebac1] hover:bg-[#dfe5e7] dark:hover:bg-[#2a3942]'
            }`}
            style={filter === 'unread' ? { backgroundColor: 'var(--accent)' } : {}}
          >
            Unread
          </button>
          <button className="bg-[#f0f2f5] dark:bg-[#202c33] text-[#54656f] dark:text-[#aebac1] px-3 py-1 rounded-full text-sm font-medium hover:bg-[#dfe5e7] dark:hover:bg-[#2a3942] transition-colors whitespace-nowrap">
            Favorites
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col gap-4 p-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-2 w-full bg-slate-50 dark:bg-slate-800/50 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-2">
            <div className="p-3 rounded-full bg-slate-50 dark:bg-slate-800">
              <User className="text-slate-300" size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400 italic">No conversations found</p>
          </div>
        ) : (
          <div className="space-y-0.5 px-2">
            {(filter === 'unread' ? conversations.filter(c => c.unread_count > 0) : conversations).map((conv) => {
              const lastMsg = conv.messages?.[0];
              const isSelected = selectedId === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={`w-full flex items-center gap-3 p-3 transition-all duration-200 group relative border-b border-[#f0f2f5] dark:border-[#202c33]/70 ${
                    isSelected 
                      ? 'bg-[#f0f2f5] dark:bg-[#2a3942]' 
                      : 'hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black transition-all duration-300 ${
                      isSelected ? 'bg-[#dfe5e7] dark:bg-[#374248] text-slate-600 dark:text-[#d1d7db]' : 'bg-[#dfe5e7] dark:bg-[#374248] text-[#717171] dark:text-[#8696a0]'
                    }`}>
                      {conv.contact?.name?.charAt(0) || '?'}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-left min-w-0 pr-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[17px] font-normal truncate ${isSelected ? 'text-[#111b21] dark:text-[#e9edef]' : 'text-[#111b21] dark:text-[#e9edef]'}`}>
                        {conv.contact?.name || (conv.contact?.phone_number ? formatPhoneNumber(conv.contact.phone_number) : 'Unknown')}
                      </span>
                      {conv.last_message_at && (
                        <span className={`text-xs whitespace-nowrap ${conv.unread_count > 0 ? 'text-accent font-medium' : 'text-[#667781] dark:text-[#8696a0]'}`} style={conv.unread_count > 0 ? { color: 'var(--accent)' } : {}}>
                          {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })
                            .replace('about ', '')
                            .replace('less than a minute', 'now')
                            .replace(' minutes', 'm')
                            .replace(' minute', 'm')
                            .replace(' hours', 'h')
                            .replace(' hour', 'h')
                            .replace(' days', 'd')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {lastMsg && lastMsg.sender === 'user' && (
                          <div className={`transition-colors shrink-0 ${
                            lastMsg.status === 'read' ? 'text-[#53bdeb]' : 'text-[#8696a0]'
                          }`}>
                            {lastMsg.status === 'pending' ? <Clock size={15} /> : 
                             lastMsg.status === 'sent' ? <Check size={18} /> : 
                             <CheckCheck size={18} />}
                          </div>
                        )}
                        <p className={`text-[14px] truncate flex-1 ${
                          conv.unread_count > 0 ? 'font-bold text-[#111b21] dark:text-[#e9edef]' : 'text-[#667781] dark:text-[#8696a0]'
                        }`}>
                          {lastMsg ? (
                            lastMsg.type === 'image' ? '📷 Image' :
                            lastMsg.type === 'video' ? '🎥 Video' :
                            lastMsg.type === 'audio' ? '🎵 Audio' :
                            lastMsg.type === 'sticker' ? '🏷️ Sticker' :
                            lastMsg.type === 'document' ? '📄 Document' :
                            lastMsg.content
                          ) : 'No messages yet'}
                        </p>
                      </div>
                      {conv.unread_count > 0 && (
                        <div className="min-w-[20px] h-[20px] rounded-full bg-accent text-white text-[12px] font-bold flex items-center justify-center px-1.5 shrink-0" style={{ backgroundColor: 'var(--accent)' }}>
                          {conv.unread_count}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

ChatSidebar.displayName = 'ChatSidebar';

export default ChatSidebar;
