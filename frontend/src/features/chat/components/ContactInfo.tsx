import React, { memo } from 'react';
import { X, Phone, Mail, Calendar, User, Shield, Ban, MessageSquare } from 'lucide-react';
import { Conversation } from '@/api/chatService';
import { formatPhoneNumber } from '@/lib/utils';

interface ContactInfoProps {
  conversation: Conversation;
  onClose: () => void;
}

const ContactInfo: React.FC<ContactInfoProps> = memo(({ conversation, onClose }) => {
  const { contact } = conversation;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#111b21] border-l border-[#e9edef] dark:border-[#202c33] animate-in slide-in-from-right duration-300 w-full md:w-[350px] lg:w-[400px]">
      {/* Header */}
      <div className="p-4 flex items-center gap-4 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-slate-200 dark:border-slate-800 min-h-[64px]">
        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-all active:scale-90">
          <X size={24} />
        </button>
        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Contact Info</h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Profile Pic & Name */}
        <div className="flex flex-col items-center p-8 bg-white dark:bg-[#111b21] border-b border-[#f0f2f5] dark:border-[#222d34]">
          <div className="w-40 h-40 rounded-full bg-accent flex items-center justify-center text-white text-6xl font-black shadow-2xl mb-6" style={{ backgroundColor: 'var(--accent)' }}>
            {contact?.name?.charAt(0) || '?'}
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-1">
            {contact?.name || 'Unknown'}
          </h2>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
            {contact?.phone_number ? formatPhoneNumber(contact.phone_number) : 'No phone'}
          </p>
        </div>

        {/* About */}
        <div className="p-6 border-b border-[#f0f2f5] dark:border-[#222d34]">
          <h4 className="text-[13px] font-bold text-[#54656f] dark:text-[#8696a0] uppercase tracking-wider mb-4">About</h4>
          <p className="text-[15px] text-[#111b21] dark:text-[#d1d7db] leading-relaxed">
            Hey there! I am using WhatsApp Widget.
          </p>
        </div>

        {/* Contact Info Items */}
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-4 px-2">
            <div className="text-slate-400"><Phone size={20} /></div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{contact?.phone_number ? formatPhoneNumber(contact.phone_number) : ''}</p>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Mobile</p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-2">
            <div className="text-slate-400"><MessageSquare size={20} /></div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Direct Message</p>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Start a new chat</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 space-y-1">
          <button className="w-full flex items-center gap-4 px-3 py-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all rounded-xl font-bold">
            <Ban size={20} />
            <span>Block {contact?.name}</span>
          </button>
          <button className="w-full flex items-center gap-4 px-3 py-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all rounded-xl font-bold">
            <Shield size={20} />
            <span>Report {contact?.name}</span>
          </button>
        </div>
      </div>
    </div>
  );
});

ContactInfo.displayName = 'ContactInfo';

export default ContactInfo;
