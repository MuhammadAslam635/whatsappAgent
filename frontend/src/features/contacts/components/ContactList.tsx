import React, { memo, useState, useEffect } from 'react';
import { Edit2, Trash2, Search, User, Phone, Loader2, AlertCircle, CheckSquare, Square } from 'lucide-react';
import { Contact, PaginatedResponse } from '@/api/contactService';
import { formatPhoneNumber } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination/Pagination';
import Button from '@/components/ui/Button/Button';

interface ContactListProps {
  contacts: Contact[];
  pagination: PaginatedResponse<Contact> | null;
  onPageChange: (page: number) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: number) => void;
  onBulkDelete: (ids: number[]) => void;
  onSearchChange: (search: string) => void;
  isLoading: boolean;
  search: string;
}

const ContactList: React.FC<ContactListProps> = memo(({ 
  contacts, 
  pagination, 
  onPageChange, 
  onEdit, 
  onDelete,
  onBulkDelete,
  onSearchChange,
  isLoading,
  search
}) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Reset selection when contacts change (e.g., page change)
  useEffect(() => {
    setSelectedIds([]);
  }, [contacts]);

  const toggleSelectAll = () => {
    if (selectedIds.length === contacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(contacts.map(c => c.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    onBulkDelete(selectedIds);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative group w-full md:max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search all contacts (Name or Number)..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-accent/5 outline-none transition-all shadow-sm"
          />
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest hidden md:block">
              {selectedIds.length} Selected
            </span>
            <Button 
              onClick={handleBulkDelete}
              variant="outline"
              className="rounded-xl h-10 px-4 text-[10px] font-black border-red-200 text-red-500 hover:bg-red-500 hover:text-white transition-all"
            >
              <Trash2 size={14} className="mr-2" /> Delete Selected
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="px-4 py-3 w-10">
                  {/* Selection column header - checkbox removed as per user request */}
                </th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {isLoading ? (
                <tr>
                   <td colSpan={4} className="px-6 py-20 text-center">
                       <Loader2 className="animate-spin text-accent mx-auto mb-2" size={24} style={{ color: 'var(--accent)' }} />
                       <p className="text-xs font-bold text-slate-400">Loading contacts...</p>
                   </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <AlertCircle size={24} />
                    </div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{search ? 'No contacts match your search' : 'No contacts found'}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Try adding a contact or importing a CSV</p>
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr 
                    key={contact.id} 
                    className={`group transition-all duration-300 ${selectedIds.includes(contact.id) ? 'bg-accent/5 dark:bg-accent/10 hover:bg-accent/10 dark:hover:bg-accent/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'}`}
                  >
                    <td className="px-4 py-2.5">
                      <button 
                        onClick={() => toggleSelect(contact.id)}
                        className={`p-1 rounded-md transition-all ${selectedIds.includes(contact.id) ? 'text-accent' : 'text-slate-300 group-hover:text-slate-400'}`}
                      >
                        {selectedIds.includes(contact.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${selectedIds.includes(contact.id) ? 'bg-accent text-white scale-110' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:scale-110 group-hover:bg-accent group-hover:text-white'}`}>
                          <User size={14} />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight">{contact.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 leading-tight mt-0.5 max-w-[150px] truncate">{contact.description || 'No description'}</p>
                        </div>
                      </div>
                    </td>
                     <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold text-[13px]">
                        <Phone size={12} className="text-slate-400" />
                         {formatPhoneNumber(contact.phone_number)}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                            onClick={() => onEdit(contact)}
                            className="p-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-accent/30 text-accent transition-all shadow-sm hover:shadow-md"
                            title="Edit Contact"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                             onClick={() => onDelete(contact.id)}
                            className="p-2 bg-red-500/5 dark:bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg border border-red-500/20 hover:border-red-500 transition-all shadow-sm hover:shadow-lg shadow-red-500/10"
                            title="Delete Contact"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && contacts.length > 0 && (
        <Pagination 
          currentPage={pagination.current_page}
          lastPage={pagination.last_page}
          onPageChange={onPageChange}
          isLoading={isLoading}
        />
      )}
    </div>
  );
});

ContactList.displayName = 'ContactList';

export default ContactList;
