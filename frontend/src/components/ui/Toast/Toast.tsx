import React, { memo } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { ToastType } from '../../../store/ToastContext';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastProps> = memo(({ id, message, type, onRemove }) => {
  const icons = {
    success: <CheckCircle2 className="text-emerald-500" size={18} />,
    error: <AlertCircle className="text-red-500" size={18} />,
    warning: <AlertTriangle className="text-amber-500" size={18} />,
    info: <Info className="text-blue-500" size={18} />,
  };

  const bgColors = {
    success: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20',
    error: 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20',
    warning: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20',
    info: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20',
  };

  return (
    <div className={`flex items-center gap-3 p-4 pr-10 rounded-2xl border shadow-lg animate-in fade-in slide-in-from-right-4 duration-300 pointer-events-auto relative ${bgColors[type]}`}>
      <div className="flex-shrink-0">
        {icons[type]}
      </div>
      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
        {message}
      </p>
      <button 
        onClick={() => onRemove(id)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
});

interface ToastContainerProps {
  toasts: { id: string; message: string; type: ToastType }[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = memo(({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onRemove={onRemove} />
      ))}
    </div>
  );
});

ToastItem.displayName = 'ToastItem';
ToastContainer.displayName = 'ToastContainer';

export default ToastContainer;
