import React, { memo, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import { AuthProvider } from './store/AuthContext';
import { ToastProvider } from './store/ToastContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AxiosInterceptor from './components/api/AxiosInterceptor';
import ErrorBoundary from './components/ErrorBoundary';

const HomePage = React.lazy(() => import('./features/home/pages/home'));
const DashboardPage = React.lazy(() => import('./features/dashboard/pages/dashboard'));

const AppContent: React.FC = memo(() => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <Suspense fallback={<div className="flex items-center justify-center p-20 min-h-screen bg-slate-50 dark:bg-[#020617]">
      <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
    </div>}>
      {!isDashboard && <Header />}
      <main className={`flex-1 w-full ${!isDashboard ? 'pt-14' : ''}`}>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route 
              path="/dashboard/*" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </ErrorBoundary>
      </main>
    </Suspense>
  );
});

const App: React.FC = memo(() => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AxiosInterceptor>
            <BrowserRouter>
              <div className="min-h-screen flex flex-col bg-white dark:bg-[#020617]">
                <AppContent />
              </div>
            </BrowserRouter>
          </AxiosInterceptor>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
});

App.displayName = 'App';

export default App;
