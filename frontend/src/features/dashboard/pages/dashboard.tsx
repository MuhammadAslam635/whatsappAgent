import React, { memo } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Overview from './Overview';
import ChatPage from '../../chat/pages/ChatPage';
import ContactsPage from '../../contacts/pages/ContactsPage';
import Settings from './Settings';
import BulkMessagePage from '@/features/chat/pages/BulkMessagePage';
import KnowledgeBaseSettings from './KnowledgeBaseSettings';

const DashboardPage: React.FC = memo(() => {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/upload" element={<ContactsPage />} />
        <Route path="/bulk" element={<BulkMessagePage />} />
        <Route path="/ai" element={<KnowledgeBaseSettings />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </DashboardLayout>
  );
});

DashboardPage.displayName = 'DashboardPage';

export default DashboardPage;
