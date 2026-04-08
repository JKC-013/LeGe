/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { SongDetail } from './pages/SongDetail';
import { PublisherDashboard } from './pages/PublisherDashboard';
import { AdminHub } from './pages/AdminHub';
import { Favourites } from './pages/Favourites';
import { Collection } from './pages/Collection';
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
          <Route path="song/:id" element={<SongDetail />} />
          <Route path="favourites" element={
            <ProtectedRoute allowedRoles={['user', 'publisher', 'admin']}>
              <Favourites />
            </ProtectedRoute>
          } />
          <Route path="collection" element={
            <ProtectedRoute allowedRoles={['user', 'publisher', 'admin']}>
              <Collection />
            </ProtectedRoute>
          } />
          <Route path="publisher" element={
            <ProtectedRoute allowedRoles={['publisher', 'admin']}>
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
