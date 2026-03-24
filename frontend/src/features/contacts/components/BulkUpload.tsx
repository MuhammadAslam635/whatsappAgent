import React, { memo, useState, useCallback } from 'react';
import { Upload, X, FileText, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import contactService from '@/api/contactService';
import Button from '@/components/ui/Button/Button';
import { useToast } from '@/store/ToastContext';
import { getCountries, getCountryCallingCode } from 'react-phone-number-input';
import en from 'react-phone-number-input/locale/en';

interface BulkUploadProps {
  onClose: () => void;
  onRefresh: () => void;
}

const BulkUpload: React.FC<BulkUploadProps> = memo(({ onClose, onRefresh }) => {
  const [file, setFile] = useState<File | null>(null);
  const [defaultCountry, setDefaultCountry] = useState('PK');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{ message: string; errors: string[]; count: number } | null>(null);
  const { success: showSuccess, error: showError } = useToast();
  
  const countries = getCountries();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv'))) {
      setFile(selectedFile);
      setResults(null);
    } else {
      showError('Please select a valid CSV file.');
    }
  };

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setIsLoading(true);

    try {
      const response = await contactService.bulkUpload(file, defaultCountry);
      setResults(response);
      showSuccess(`Successfully uploaded ${response.count} contacts.`);
      onRefresh();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to upload CSV file.');
    } finally {
      setIsLoading(false);
    }
  }, [file, defaultCountry, onRefresh, showSuccess, showError]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
      setFile(droppedFile);
      setResults(null);
    } else {
      showError('Please drop a valid CSV file.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {!results ? (
        <div className="space-y-4">
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`relative group cursor-pointer border-2 border-dashed rounded-[32px] p-12 transition-all duration-500 flex flex-col items-center justify-center gap-4 ${
              file 
              ? 'border-accent/40 bg-accent/5' 
              : 'border-slate-200 dark:border-slate-800 hover:border-accent/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
            }`}
          >
            <input 
              type="file" 
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 ${
              file ? 'bg-accent text-white scale-110' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:scale-110 group-hover:text-accent'
            }`}>
              {file ? <FileText size={32} /> : <Upload size={32} />}
            </div>

            <div className="text-center">
              <p className="text-sm font-black text-slate-900 dark:text-white mb-1">
                {file ? file.name : 'Click or Drag CSV here'}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Maximum file size: 2MB'}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#54656f] dark:text-[#8696a0] ml-1 uppercase tracking-wider">Default Country (Fallback)</label>
            <select
              value={defaultCountry}
              onChange={(e) => setDefaultCountry(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-[#2a3942] border border-[#e9edef] dark:border-[#2a3942] rounded-xl text-[15px] focus:ring-0 focus:border-accent outline-none transition-all text-[#111b21] dark:text-[#e9edef] appearance-none cursor-pointer"
            >
              {countries.map((country) => (
                <option key={country} value={country}>
                  {en[country]} (+{getCountryCallingCode(country)})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1 font-medium italic">
              * Used if CSV number doesn't have a country code
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-3">
            <AlertCircle className="text-amber-500 shrink-0" size={18} />
            <div className="space-y-1">
                <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">CSV Requirements</p>
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500/80 leading-relaxed">
                    Make sure your CSV has a header row with <code className="bg-amber-500/10 px-1 rounded-sm">name</code> and <code className="bg-amber-500/10 px-1 rounded-sm">phone</code> columns.
                </p>
            </div>
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
                onClick={handleUpload}
                disabled={!file || isLoading}
                className="flex-1 rounded-xl h-12 text-xs font-black bg-accent text-white shadow-lg shadow-accent/20"
                style={{ backgroundColor: 'var(--accent)' }}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Start Upload'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4 scale-125">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Upload Complete!</h3>
            <p className="text-xs font-bold text-slate-500">
                We've processed your contact list.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-center">
                  <p className="text-2xl font-black text-accent">{results.count}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Success</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-center">
                  <p className="text-2xl font-black text-slate-400">{results.errors.length}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Failed</p>
              </div>
          </div>

          {results.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto p-4 rounded-xl bg-red-500/5 border border-red-500/10 space-y-2 scrollbar-hide">
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">Error Details</p>
                  {results.errors.map((err, i) => (
                      <p key={i} className="text-[10px] font-bold text-red-600/80 leading-relaxed">• {err}</p>
                  ))}
              </div>
          )}

          <Button 
            variant="outline" 
            className="w-full rounded-xl h-12 text-xs font-black border-slate-200 dark:border-slate-700 mt-4"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      )}
    </div>
  );
});

BulkUpload.displayName = 'BulkUpload';

export default BulkUpload;
