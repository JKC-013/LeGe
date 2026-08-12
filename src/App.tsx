/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { SongsCatalog } from './pages/SongsCatalog';
import { SongDetail } from './pages/SongDetail';
import { ServiceRequests } from './pages/ServiceRequests';
import { PublisherDashboard } from './pages/PublisherDashboard';
import { AdminHub } from './pages/AdminHub';
import { Favourites } from './pages/Favourites';
import { Notifications } from './pages/Notifications';
import { useStore } from './store';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const { currentUser, isInitialized } = useStore();
  
  if (!isInitialized) return null; // Or a loading spinner
  if (!currentUser) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(currentUser.role)) return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

export default function App() {
  const { initialize } = useStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="songs" element={<SongsCatalog />} />
          <Route path="song/:id" element={<SongDetail />} />
          <Route path="favourites" element={
            <ProtectedRoute allowedRoles={['user', 'pastor', 'collaborator', 'admin']}>
              <Favourites />
            </ProtectedRoute>
          } />
          <Route path="requests" element={
            <ProtectedRoute allowedRoles={['user', 'pastor', 'collaborator', 'admin']}>
              <ServiceRequests />
            </ProtectedRoute>
          } />
          <Route path="notifications" element={
            <ProtectedRoute allowedRoles={['user', 'pastor', 'collaborator', 'admin']}>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="publisher" element={
            <ProtectedRoute allowedRoles={['collaborator', 'admin', 'publisher']}>
              <PublisherDashboard />
            </ProtectedRoute>
          } />
          <Route path="admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminHub />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
