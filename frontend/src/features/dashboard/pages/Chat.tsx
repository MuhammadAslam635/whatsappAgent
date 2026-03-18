import React, { memo } from 'react';

const Chat: React.FC = memo(() => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Active <span className="text-accent">Chats</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
          Manage and respond to your active transformations.
        </p>
      </header>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm min-h-[400px] flex items-center justify-center text-slate-400 italic">
        Chat Interface Coming Soon
      </div>
    </div>
  );
});

Chat.displayName = 'Chat';

export default Chat;
