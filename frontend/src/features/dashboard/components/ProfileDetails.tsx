import React, { memo, useCallback } from 'react';
import { User, LogOut, Settings, Shield, CreditCard } from 'lucide-react';
import { useAuth } from '../../../store/AuthContext';
import Button from '../../../components/ui/Button/Button';

interface ProfileDetailsProps {
  onClose: () => void;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = memo(({ onClose }) => {
  const { user, logout } = useAuth();

  const handleLogout = useCallback(async () => {
    await logout();
    onClose();
  }, [logout, onClose]);

  if (!user) return null;

  return (
    <div className="absolute top-full right-0 mt-3 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[100] origin-top-right">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-slate-700 shadow-md">
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col truncate">
            <span className="text-sm font-black text-slate-900 dark:text-white truncate">{user.name}</span>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate tracking-tight">{user.email}</span>
          </div>
        </div>
      </div>

      <div className="p-2 flex flex-col gap-0.5">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all group">
          <Shield size={18} className="group-hover:text-accent transition-colors" />
          <span className="text-xs font-bold">Account Security</span>
        </button>
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all group">
          <CreditCard size={18} className="group-hover:text-accent transition-colors" />
          <span className="text-xs font-bold">Billing & Plan</span>
        </button>
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all group">
          <Settings size={18} className="group-hover:text-accent transition-colors" />
          <span className="text-xs font-bold">Settings</span>
        </button>
      </div>

      <div className="p-2 border-t border-slate-100 dark:border-slate-800">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/5 hover:text-red-600 font-bold"
        >
          <LogOut size={18} />
          Logout
        </Button>
      </div>
    </div>
  );
});

ProfileDetails.displayName = 'ProfileDetails';

export default ProfileDetails;
