import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  lastPage, 
  onPageChange,
  isLoading = false 
}) => {
  if (lastPage <= 1) return null;

  const pages = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(lastPage, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <ChevronLeft size={16} className="text-slate-600 dark:text-slate-400" />
      </button>

      <div className="flex items-center gap-1">
        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                currentPage === 1 
                ? 'bg-accent text-white shadow-lg shadow-accent/20' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              style={currentPage === 1 ? { backgroundColor: 'var(--accent)' } : {}}
            >
              1
            </button>
            {startPage > 2 && <span className="px-1 text-slate-400">...</span>}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            disabled={isLoading}
            className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
              currentPage === page 
              ? 'bg-accent text-white shadow-lg shadow-accent/20' 
              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            style={currentPage === page ? { backgroundColor: 'var(--accent)' } : {}}
          >
            {page}
          </button>
        ))}

        {endPage < lastPage && (
          <>
            {endPage < lastPage - 1 && <span className="px-1 text-slate-400">...</span>}
            <button
              onClick={() => onPageChange(lastPage)}
              className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                currentPage === lastPage 
                ? 'bg-accent text-white shadow-lg shadow-accent/20' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              style={currentPage === lastPage ? { backgroundColor: 'var(--accent)' } : {}}
            >
              {lastPage}
            </button>
          </>
        )}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === lastPage || isLoading}
        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <ChevronRight size={16} className="text-slate-600 dark:text-slate-400" />
      </button>
    </div>
  );
};

export default Pagination;
