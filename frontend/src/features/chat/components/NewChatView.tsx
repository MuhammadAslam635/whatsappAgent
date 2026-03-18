import React, { memo, useState, useMemo } from 'react';
import { ArrowLeft, Search, UserPlus, Users, MessageSquare } from 'lucide-react';
import { Contact } from '@/api/contactService';
import { formatPhoneNumber } from '@/lib/utils';

interface NewChatViewProps {
  contacts: Contact[];
  onBack: () => void;
  onSelect: (contact: Contact) => void;
  onAddContact: () => void;
  isLoading: boolean;
}

const NewChatView: React.FC<NewChatViewProps> = memo(({
  contacts,
  onBack,
  onSelect,
  onAddContact,
  isLoading
}) => {
  const [search, setSearch] = useState('');

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.phone_number.includes(search)
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [contacts, search]);

  const groupedContacts = useMemo(() => {
    const groups: { [key: string]: Contact[] } = {};
    filteredContacts.forEach(c => {
      const firstLetter = c.name.charAt(0).toUpperCase();
      const key = /[A-Z]/.test(firstLetter) ? firstLetter : '#';
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    });
    return groups;
  }, [filteredContacts]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21] animate-in slide-in-from-left duration-300">
      {/* Header */}
      <div className="bg-accent dark:bg-[#202c33] text-white h-[108px] flex flex-col justify-end pb-3 px-6" style={{ backgroundColor: 'var(--accent)' }}>
        <div className="flex items-center gap-6 mb-4">
          <button onClick={onBack} className="hover:bg-black/10 p-1 rounded-full text-white">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-[19px] font-medium leading-none">New chat</h2>
        </div>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-[#f0f2f5] dark:border-[#202c33]">
        <div className="relative flex items-center bg-[#f0f2f5] dark:bg-[#202c33] rounded-lg px-3">
          <Search className="text-[#54656f] dark:text-[#aebac1] mr-3" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or number"
            className="flex-1 py-1.5 bg-transparent border-none text-[15px] focus:ring-0 outline-none text-[#111b21] dark:text-[#e9edef] placeholder:text-[#54656f] dark:placeholder:text-[#aebac1]"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Quick Actions */}
        <div className="space-y-0.5 py-2">
          <button 
            onClick={onAddContact}
            className="w-full flex items-center gap-4 px-4 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white" style={{ backgroundColor: 'var(--accent)' }}>
              <UserPlus size={24} />
            </div>
            <div className="flex-1 text-left">
              <span className="text-[17px] text-[#111b21] dark:text-[#e9edef]">New contact</span>
            </div>
          </button>
        </div>

        {/* Contacts List */}
        <div className="py-2">
          {Object.keys(groupedContacts).sort().map(letter => (
            <div key={letter}>
              <div className="px-6 py-4 text-accent dark:text-[#8696a0] text-sm font-medium h-[72px] flex items-center" style={{ color: 'var(--accent)' }}>
                {letter}
              </div>
              {groupedContacts[letter].map(contact => (
                <button
                  key={contact.id}
                  onClick={() => onSelect(contact)}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#dfe5e7] dark:bg-[#374248] flex items-center justify-center text-[#717171] dark:text-[#8696a0]">
                    {contact.name.charAt(0)}
                  </div>
                  <div className="flex-1 text-left border-b border-[#f0f2f5] dark:border-[#202c33]/70 pb-3 h-full flex flex-col justify-center">
                    <span className="text-[17px] text-[#111b21] dark:text-[#e9edef]">{contact.name}</span>
                    <span className="text-[14px] text-[#667781] dark:text-[#8696a0]">{formatPhoneNumber(contact.phone_number)}</span>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

NewChatView.displayName = 'NewChatView';

export default NewChatView;
