import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, Mic, X } from 'lucide-react';
import Button from '@/components/ui/Button/Button';
import EmojiPicker, { Theme } from 'emoji-picker-react';

interface MessageInputProps {
  onSend: (content: string, file?: File | null) => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = memo(({ onSend, disabled }) => {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = useCallback(() => {
    if ((!content.trim() && !selectedFile) || disabled) return;
    
    // Pass both content and selected file
    onSend(content.trim(), selectedFile);
    
    setContent('');
    setSelectedFile(null);
    setShowEmojiPicker(false);
    
    if (inputRef.current) {
        inputRef.current.style.height = 'auto';
    }
  }, [content, disabled, onSend, selectedFile]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    setContent(textarea.value);
  };

  const onEmojiClick = (emojiObject: any) => {
    setContent(prev => prev + emojiObject.emoji);
    // Keep focus on textarea
    inputRef.current?.focus();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col z-20">
      {selectedFile && (
        <div className="px-4 py-2 bg-white dark:bg-[#111b21] border-t border-[#e9edef] dark:border-none flex items-center justify-between animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/20 rounded-md flex items-center justify-center text-accent">
               <Paperclip size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#111b21] dark:text-[#e9edef] truncate max-w-[200px]">{selectedFile.name}</p>
              <p className="text-[10px] text-[#54656f] dark:text-[#8696a0]">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <button 
            onClick={() => setSelectedFile(null)}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-[#54656f] dark:text-[#aebac1]"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-14 left-2 z-50 shadow-2xl animate-in fade-in zoom-in-95 duration-200 bg-white rounded-xl">
          <EmojiPicker 
            onEmojiClick={onEmojiClick}
            theme={Theme.LIGHT}
            width={320}
            height={400}
            skinTonesDisabled
            searchDisabled={false}
          />
        </div>
      )}

      <div className="px-3 py-2 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center gap-2 border-t border-[#e9edef] dark:border-none">
        <div className="flex items-center text-[#54656f] dark:text-[#aebac1]">
          <button 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors ${showEmojiPicker ? 'text-accent' : ''}`}
          >
            <Smile size={24} />
          </button>
          <button 
            onClick={triggerFileUpload}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <Paperclip size={24} className="rotate-45" />
          </button>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="flex-1">
          <textarea
            ref={inputRef}
            rows={1}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            disabled={disabled}
            className="w-full px-4 py-2 bg-white dark:bg-[#2a3942] border-none rounded-lg text-[15px] focus:ring-0 outline-none resize-none scrollbar-hide text-[#111b21] dark:text-[#e9edef] placeholder:text-[#54656f] dark:placeholder:text-[#8696a0]"
          />
        </div>

        <div className="flex items-center">
          {(content.trim() || selectedFile) ? (
            <button
              onClick={handleSend}
              disabled={disabled}
              className="w-12 h-12 flex items-center justify-center text-white rounded-full transition-all active:scale-95 shadow-md hover:shadow-lg"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <Send size={22} className="ml-1" />
            </button>
          ) : (
            <button className="p-2 text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
              <Mic size={24} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

MessageInput.displayName = 'MessageInput';

export default MessageInput;
