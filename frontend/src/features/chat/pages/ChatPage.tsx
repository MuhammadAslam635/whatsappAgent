import React, { FC, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Phone, Video, MoreVertical, Check, CheckCheck, Clock, User, Shield, Ban } from 'lucide-react';
import chatService, { Conversation, Message } from '@/api/chatService';
import contactService, { Contact } from '@/api/contactService';
import { formatPhoneNumber } from '@/lib/utils';
import { useToast } from '@/store/ToastContext';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';
import MessageInput from '../components/MessageInput';
import NewChatView from '../components/NewChatView';
import Modal from '@/components/ui/Modal/Modal';
import ContactForm from '../../contacts/components/ContactForm';
import ContactInfo from '../components/ContactInfo';

const ChatPage: FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [view, setView] = useState<'chats' | 'new-chat'>('chats');
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isViewingContact, setIsViewingContact] = useState(false);
  const [isClearingChat, setIsClearingChat] = useState(false);
  const [isDeletingChat, setIsDeletingChat] = useState(false);
  
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [search, setSearch] = useState('');
  
  const toast = useToast();
  const pollInterval = useRef<number | null>(null);
  const sendingRef = useRef(false);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await chatService.getConversations();
      // Only update if data changed to avoid re-renders
      setConversations(prev => {
          if (JSON.stringify(prev) === JSON.stringify(response.data)) return prev;
          return response.data;
      });
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    } finally {
      setIsLoadingConvs(false);
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      const response = await contactService.getAll(1, 1000);
      setContacts(response.data);
    } catch (err) {
      console.error('Failed to fetch contacts', err);
    }
  }, []);

  const fetchMessages = useCallback(async (convId: number) => {
    if (convId === -1) return;
    try {
      const response = await chatService.getMessages(convId);
      setMessages(prev => {
          const backendMsgs = response.data;
          
          // Secure Deduplication & Status Sync:
          // Use ID as the unique key to catch status updates
          const allMsgs = [...prev, ...backendMsgs];
          const unique = new Map<string, Message>();

          allMsgs.forEach(m => {
              const idStr = m.id.toString();
              const existing = unique.get(idStr);
              
              if (!existing) {
                  unique.set(idStr, m);
              } else {
                  // Always overwrite existing with backend data if IDs match
                  // and one is from the backend (real ID) vs optimistic local ID
                  const isNewTemp = idStr.startsWith('temp-');
                  const isExistingTemp = existing.id.toString().startsWith('temp-');
                  
                  if (isExistingTemp && !isNewTemp) {
                      unique.set(idStr, m);
                  } else if (!isNewTemp) {
                      // If both are real, the backend one is usually fresher (updated status)
                      unique.set(idStr, m);
                  }
              }
          });

          const result = Array.from(unique.values()).sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );

          if (JSON.stringify(prev) === JSON.stringify(result)) return prev;
          return result;
      });
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    fetchContacts();
  }, [fetchConversations, fetchContacts]);

  useEffect(() => {
    if (pollInterval.current) clearInterval(pollInterval.current);
    
    pollInterval.current = window.setInterval(() => {
        fetchConversations();
        if (selectedConv && selectedConv.id !== -1) {
            fetchMessages(selectedConv.id);
        }
    }, 5000);

    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [fetchConversations, selectedConv?.id, fetchMessages]);

  const handleSelectConversation = useCallback((id: number) => {
    const conv = conversations.find((c: Conversation) => c.id === id);
    if (conv) {
      setSelectedConv(conv);
      // CLEAR old messages immediately to prevent merging leaks from previous chats
      setMessages([]);
      setIsLoadingMessages(true);
      fetchMessages(id);
      
      if (conv.unread_count > 0) {
          chatService.markAsRead(id).catch(console.error);
          // Optimistically clear unread count in UI
          setConversations(prev => prev.map(c => c.id === id ? { ...c, unread_count: 0 } : c));
      }
    }
  }, [conversations, fetchMessages]);

  const handleSelectContactForChat = useCallback((contact: Contact) => {
    let conv = conversations.find((c: Conversation) => c.contact_id === contact.id);
    if (!conv) {
      conv = {
        id: -1,
        user_id: 0,
        contact_id: contact.id,
        unread_count: 0,
        last_message_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        contact: contact,
        messages: []
      } as any;
    }
    if (conv) {
      setSelectedConv(conv);
      setMessages(conv.messages || []);
      // If It's an existing conversation, fetch fresh messages
      if (conv.id !== -1) {
        setIsLoadingMessages(true);
        fetchMessages(conv.id);
      }
      setView('chats');
    }
  }, [conversations]);

  const handleClearChat = useCallback(async () => {
    if (!selectedConv) return;
    try {
      await chatService.clearMessages(selectedConv.id);
      setMessages([]);
      setIsClearingChat(false);
      toast.success('Chat cleared');
    } catch (err) {
      toast.error('Failed to clear chat');
    }
  }, [selectedConv, toast]);

  const handleDeleteChat = useCallback(async () => {
    if (!selectedConv) return;
    try {
      await chatService.deleteConversation(selectedConv.id);
      setConversations(prev => prev.filter(c => c.id !== selectedConv.id));
      setSelectedConv(undefined);
      setMessages([]);
      setIsDeletingChat(false);
      toast.success('Chat deleted');
    } catch (err) {
      toast.error('Failed to delete chat');
    }
  }, [selectedConv, toast]);

  const handleSendMessage = useCallback(async (content: string, file?: File | null) => {
    if (!selectedConv || isSending || sendingRef.current || (!content.trim() && !file)) return;

    sendingRef.current = true;
    setIsSending(true);
    const convId = selectedConv.id;
    const tempId = 'temp-' + Date.now();
    const tempMsg: Message = {
        id: tempId as any,
        conversation_id: convId,
        sender: 'user',
        content: content.trim() || (file ? `📎 ${file.name}` : ''),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    } as any;

    // Optimistic Update
    setMessages(prev => [...prev, tempMsg]);

    try {
      const realMsg = await chatService.sendMessage(selectedConv.contact_id, content.trim(), file);
      
      setMessages(prev => prev.map(m => m.id === tempId as any ? realMsg : m));
      
      // Update conversations list immediately
      if (selectedConv.id === -1) {
          const updatedConvs = await chatService.getConversations();
          setConversations(updatedConvs.data);
          const realConv = updatedConvs.data.find((c: Conversation) => c.contact_id === selectedConv.contact_id);
          if (realConv) setSelectedConv(realConv);
      } else {
          fetchConversations();
      }
    } catch (err) {
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(m => m.id !== tempId as any));
    } finally {
      setIsSending(false);
      sendingRef.current = false;
    }
  }, [selectedConv, isSending, fetchConversations, toast]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((c: Conversation) => 
      c.contact?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.contact?.phone_number?.includes(search)
    );
  }, [conversations, search]);

  return (
    <div className="h-full flex bg-white dark:bg-[#111b21] rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="w-full md:w-[350px] lg:w-[450px] flex-shrink-0 relative overflow-hidden border-r border-[#e9edef] dark:border-[#202c33] flex flex-col min-h-0">
        {view === 'chats' ? (
          <ChatSidebar 
            conversations={filteredConversations}
            selectedId={selectedConv?.id}
            onSelect={handleSelectConversation}
            search={search}
            onSearchChange={setSearch}
            isLoading={isLoadingConvs}
            onNewChat={() => setView('new-chat')}
          />
        ) : (
          <NewChatView 
            contacts={contacts}
            onBack={() => setView('chats')}
            onSelect={handleSelectContactForChat}
            onAddContact={() => setIsAddingContact(true)}
            isLoading={false}
          />
        )}
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-[#efeae2] dark:bg-[#0b141a]">
        <div className="flex-1 flex flex-col min-h-0 relative">
          <ChatWindow 
            conversation={selectedConv}
            messages={messages}
            isLoading={isLoadingMessages}
            onLoadMore={() => {}}
            hasMore={false}
            onClear={() => setIsClearingChat(true)}
            onDelete={() => setIsDeletingChat(true)}
            onViewContact={() => setIsViewingContact(true)}
          />
          
          {selectedConv && messages.length === 0 && selectedConv.id === -1 && (
            <div className="absolute inset-0 flex items-center justify-center p-6 z-10 pointer-events-none">
                <div className="bg-white dark:bg-[#202c33] p-8 rounded-lg shadow-xl text-center max-w-sm pointer-events-auto border border-slate-200 dark:border-slate-800">
                    <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto mb-4 flex items-center justify-center text-slate-400">
                        <User size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {selectedConv.contact?.phone_number ? formatPhoneNumber(selectedConv.contact.phone_number) : 'No Number'}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
                        {selectedConv.contact ? 'Not a contact' : 'Contact deleted'} • No groups in common
                    </p>
                    <div className="flex flex-col gap-3">
                        <button className="py-2 px-4 rounded-full border border-green-500 text-green-500 font-bold hover:bg-green-50 transition-colors flex items-center justify-center gap-2">
                            <Shield size={16} /> Safety tools
                        </button>
                        <button className="py-2 px-4 rounded-full bg-slate-100 dark:bg-slate-800 text-red-500 font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                            <Ban size={16} /> Block
                        </button>
                    </div>
                </div>
            </div>
          )}
        </div>
        {selectedConv && (
          <div className="flex-shrink-0">
            <MessageInput onSend={handleSendMessage} disabled={isSending} />
          </div>
        )}
      </div>

      {isViewingContact && selectedConv && (
        <ContactInfo 
          conversation={selectedConv} 
          onClose={() => setIsViewingContact(false)} 
        />
      )}

      <Modal 
        isOpen={isClearingChat} 
        onClose={() => setIsClearingChat(false)}
        title="Clear Chat?"
      >
        <div className="space-y-6">
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            Are you sure you want to clear all messages in this chat? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <button 
              onClick={() => setIsClearingChat(false)}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleClearChat}
              className="px-6 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 active:scale-95 transition-all"
            >
              Clear Chat
            </button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isDeletingChat} 
        onClose={() => setIsDeletingChat(false)}
        title="Delete Chat?"
      >
        <div className="space-y-6">
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            Are you sure you want to delete this entire conversation? All messages will be permanently removed.
          </p>
          <div className="flex gap-3 justify-end">
            <button 
              onClick={() => setIsDeletingChat(false)}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleDeleteChat}
              className="px-6 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 active:scale-95 transition-all"
            >
              Delete Chat
            </button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isAddingContact} 
        onClose={() => setIsAddingContact(false)}
        title="Add New Contact"
      >
        <ContactForm 
          onRefresh={() => {
            fetchContacts();
            toast.success('Contact added successfully');
          }}
          onClose={() => setIsAddingContact(false)}
        />
      </Modal>
    </div>
  );
};

export default ChatPage;
