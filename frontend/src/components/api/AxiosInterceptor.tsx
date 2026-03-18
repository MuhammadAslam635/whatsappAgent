import React, { useEffect } from 'react';
import { useToast } from '../../store/ToastContext';
import { setupAxiosInterceptors } from '../../api/axios';

const AxiosInterceptor: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { error } = useToast();

  useEffect(() => {
    setupAxiosInterceptors(error);
  }, [error]);

  return <>{children}</>;
};

export default AxiosInterceptor;
