import React, { memo, useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Plus, Upload, UserPlus, Search, Loader2 } from 'lucide-react';
import contactService, { Contact, PaginatedResponse } from '@/api/contactService';
import { useToast } from '@/store/ToastContext';
import ContactList from '../components/ContactList';
import Button from '@/components/ui/Button/Button';
import { useDebounce } from '@/hooks/useDebounce';

const Modal = lazy(() => import('@/components/ui/Modal/Modal'));
const ConfirmDialog = lazy(() => import('@/components/ui/Modal/ConfirmDialog'));
const ContactForm = lazy(() => import('../components/ContactForm'));
const BulkUpload = lazy(() => import('../components/BulkUpload'));

const ContactsPage: React.FC = memo(() => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<Contact> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>(undefined);
  
  // Custom Confirmation State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isLoading: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isLoading: false,
  });

  const { error: showError, success: showSuccess } = useToast();

  const fetchContacts = useCallback(async (page = 1, searchQuery = debouncedSearch) => {
    setIsLoading(true);
    try {
      const response = await contactService.getAll(page, 10, searchQuery);
      setContacts(response.data);
      setPagination(response);
      setCurrentPage(response.current_page);
    } catch (err: any) {
      showError('Failed to fetch contacts');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, showError]);

  useEffect(() => {
    fetchContacts(1, debouncedSearch);
  }, [debouncedSearch, fetchContacts]);

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setIsFormOpen(true);
  };

  const closeConfirm = () => setConfirmState(prev => ({ ...prev, isOpen: false }));

  const handleDelete = (id: number) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Contact?',
      message: 'Are you sure you want to delete this contact? This action cannot be undone.',
      isLoading: false,
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, isLoading: true }));
        try {
          await contactService.delete(id);
          showSuccess('Contact deleted successfully');
          fetchContacts(currentPage);
          closeConfirm();
        } catch (err: any) {
          showError('Failed to delete contact');
          setConfirmState(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  const handleBulkDelete = (ids: number[]) => {
    setConfirmState({
      isOpen: true,
      title: `Delete ${ids.length} Contacts?`,
      message: `Are you sure you want to delete ${ids.length} contacts? This action will permanently remove them.`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, isLoading: true }));
        try {
          await contactService.bulkDelete(ids);
          showSuccess(`Successfully deleted ${ids.length} contacts`);
          fetchContacts(currentPage);
          closeConfirm();
        } catch (err: any) {
          showError('Failed to delete selected contacts');
          setConfirmState(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  const handleAddManual = () => {
    setEditingContact(undefined);
    setIsFormOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4 mt-2">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 rounded-full bg-accent" style={{ backgroundColor: 'var(--accent)' }} />
            <span className="text-[10px] font-black text-accent uppercase tracking-[0.25em]" style={{ color: 'var(--accent)' }}>
              Directory
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
            Manage <span className="text-accent" style={{ color: 'var(--accent)' }}>Contacts</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium leading-relaxed max-w-lg">
            Organize your audience and reach out to them seamlessly through WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsBulkOpen(true)}
            className="rounded-2xl h-12 px-6 text-xs font-black border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <Upload size={16} className="mr-2.5" /> Bulk Upload
          </Button>
          <Button 
            onClick={handleAddManual}
            className="rounded-2xl h-12 px-6 text-xs font-black bg-accent text-white shadow-lg shadow-accent/20 hover:shadow-accent/40 active:scale-95 transition-all"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <UserPlus size={16} className="mr-2.5" /> Add Contact
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
        <ContactList 
          contacts={contacts}
          pagination={pagination}
          onPageChange={fetchContacts}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
          onSearchChange={setSearch}
          search={search}
          isLoading={isLoading}
        />
      </div>

      {/* Modals */}
      <Suspense fallback={null}>
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={editingContact ? 'Edit Contact' : 'Add New Contact'}
          maxWidth="max-w-lg"
        >
          <ContactForm 
            onClose={() => setIsFormOpen(false)}
            contact={editingContact}
            onRefresh={() => fetchContacts(currentPage)}
          />
        </Modal>

        <Modal
          isOpen={isBulkOpen}
          onClose={() => setIsBulkOpen(false)}
          title="Bulk Import Contacts"
          maxWidth="max-w-xl"
        >
          <BulkUpload 
            onClose={() => setIsBulkOpen(false)}
            onRefresh={() => fetchContacts(1)}
          />
        </Modal>

        <ConfirmDialog 
          isOpen={confirmState.isOpen}
          onClose={closeConfirm}
          onConfirm={confirmState.onConfirm}
          title={confirmState.title}
          message={confirmState.message}
          isLoading={confirmState.isLoading}
        />
      </Suspense>
    </div>
  );
});

ContactsPage.displayName = 'ContactsPage';

export default ContactsPage;
