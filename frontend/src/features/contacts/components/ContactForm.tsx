import React, { memo, useState, useCallback, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import contactService, { Contact } from '@/api/contactService';
import Button from '@/components/ui/Button/Button';
import { useToast } from '@/store/ToastContext';

interface ContactFormProps {
  onClose: () => void;
  contact?: Contact;
  onRefresh: () => void;
}

const ContactForm: React.FC<ContactFormProps> = memo(({ onClose, contact, onRefresh }) => {
  const [name, setName] = useState(contact?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(contact?.phone_number || '');
  const [description, setDescription] = useState(contact?.description || '');
  const [isLoading, setIsLoading] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  useEffect(() => {
    if (contact) {
      setName(contact.name);
      setPhoneNumber(contact.phone_number);
      setDescription(contact.description || '');
    }
  }, [contact]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, ''); // Store only digits for consistency
      
      if (contact) {
        await contactService.update(contact.id, {
          name,
          phone_number: cleanPhoneNumber,
          description
        });
        showSuccess('Contact updated successfully');
      } else {
        await contactService.create({
          name,
          phone_number: cleanPhoneNumber,
          description
        });
        showSuccess('Contact added successfully');
      }
      onRefresh();
      onClose();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to save contact');
    } finally {
      setIsLoading(false);
    }
  }, [name, phoneNumber, description, contact, onRefresh, onClose, showSuccess, showError]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-[#54656f] dark:text-[#8696a0] ml-1">Contact Name</label>
        <input 
          type="text" 
          placeholder="e.g. John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 bg-white dark:bg-[#2a3942] border border-[#e9edef] dark:border-[#2a3942] rounded-xl text-[15px] focus:ring-0 focus:border-accent outline-none transition-all text-[#111b21] dark:text-[#e9edef]"
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-[#54656f] dark:text-[#8696a0] ml-1">Phone Number</label>
        <input 
          type="text" 
          placeholder="e.g. 923094169184"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full px-4 py-3 bg-white dark:bg-[#2a3942] border border-[#e9edef] dark:border-[#2a3942] rounded-xl text-[15px] focus:ring-0 focus:border-accent outline-none transition-all text-[#111b21] dark:text-[#e9edef]"
          required
        />
        <p className="text-[10px] text-slate-400 mt-1 font-medium italic">
          * Include country code (e.g., 92 for Pakistan)
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-[#54656f] dark:text-[#8696a0] ml-1">Description (Optional)</label>
        <textarea 
          placeholder="Add notes about this contact..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 bg-white dark:bg-[#2a3942] border border-[#e9edef] dark:border-[#2a3942] rounded-xl text-[15px] focus:ring-0 focus:border-accent outline-none transition-all min-h-[100px] resize-none text-[#111b21] dark:text-[#e9edef]"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button 
          type="button"
          variant="outline" 
          className="flex-1 rounded-xl h-12 text-xs font-black border-slate-200 dark:border-slate-700"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="flex-1 rounded-xl h-12 text-xs font-black bg-accent text-white shadow-lg shadow-accent/20"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : (contact ? 'Update Contact' : 'Add Contact')}
        </Button>
      </div>
    </form>
  );
});

ContactForm.displayName = 'ContactForm';

export default ContactForm;
