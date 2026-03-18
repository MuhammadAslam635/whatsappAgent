import React, { memo } from 'react';
import { AlertCircle, Trash2, X } from 'lucide-react';
import Modal from './Modal';
import Button from '../Button/Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = memo(({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const isDanger = variant === 'danger';

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="text-center space-y-6 py-4">
        {/* Icon */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-all duration-500 scale-110 ${
          isDanger ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
        }`}>
          {isDanger ? <Trash2 size={32} /> : <AlertCircle size={32} />}
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed px-4">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-xl h-11 text-xs font-black border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            isLoading={isLoading}
            className={`flex-1 rounded-xl h-11 text-xs font-black text-white shadow-lg transition-all active:scale-95 ${
              isDanger 
                ? 'bg-red-500 shadow-red-500/20 hover:bg-red-600 hover:shadow-red-500/30' 
                : 'bg-amber-500 shadow-amber-500/20 hover:bg-amber-600 hover:shadow-amber-500/30'
            }`}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
});

ConfirmDialog.displayName = 'ConfirmDialog';

export default ConfirmDialog;
