import React, { memo, useState, useCallback, useMemo } from 'react';
import { Mail, Lock, Loader2 } from 'lucide-react';
import Button from '../../../components/ui/Button/Button';
import { useAuth } from '../../../store/AuthContext';

import { useNavigate } from 'react-router-dom';

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = memo(({ onSuccess }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login({ email, password, device_name: 'browser' });
      onSuccess?.();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  }, [email, password, login, onSuccess]);

  const isFormValid = useMemo(() => email.includes('@') && password.length >= 6, [email, password]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
        <div className="relative group">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors" size={18} />
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="john@example.com"
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-slate-900 dark:text-white"
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Password</label>
        <div className="relative group">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors" size={18} />
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="••••••••"
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-slate-900 dark:text-white"
            required
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading || !isFormValid}
        className="mt-2 py-4 h-14"
      >
        {isLoading ? <Loader2 className="animate-spin" /> : 'Sign In Now'}
      </Button>

      <div className="text-center mt-2">
        <button type="button" className="text-sm font-bold text-slate-500 hover:text-accent transition-colors">
          Forgot your password?
        </button>
      </div>
    </form>
  );
});

LoginForm.displayName = 'LoginForm';

export default LoginForm;
