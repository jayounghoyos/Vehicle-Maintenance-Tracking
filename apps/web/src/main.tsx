import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './auth/AuthContext.tsx';
import { RequireAuth } from './auth/RequireAuth.tsx';
import Admin from './routes/Admin.tsx';
import Dashboard from './routes/Dashboard.tsx';
import Login from './routes/Login.tsx';
import Organization from './routes/Organization.tsx';
import Register from './routes/Register.tsx';
import Schedules from './routes/Schedules.tsx';
import ServiceLog from './routes/ServiceLog.tsx';
import Team from './routes/Team.tsx';
import Vehicles from './routes/Vehicles.tsx';
import { ToastProvider } from './toast/ToastProvider.tsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    // a 401 is not worth retrying: the token is either good or it is not
    queries: { retry: false },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/"
                element={
                  <RequireAuth kind="user">
                    <Dashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/vehicles"
                element={
                  <RequireAuth kind="user" need="view_vehicles">
                    <Vehicles />
                  </RequireAuth>
                }
              />
              <Route
                path="/schedules"
                element={
                  <RequireAuth kind="user" need="view_vehicles">
                    <Schedules />
                  </RequireAuth>
                }
              />
              <Route
                path="/service-log"
                element={
                  <RequireAuth kind="user" need="view_service_log">
                    <ServiceLog />
                  </RequireAuth>
                }
              />
              <Route
                path="/team"
                element={
                  <RequireAuth kind="user" need="view_team">
                    <Team />
                  </RequireAuth>
                }
              />
              <Route
                path="/team/organization"
                element={
                  <RequireAuth kind="user" need="view_team">
                    <Organization />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin"
                element={
                  <RequireAuth kind="admin">
                    <Admin />
                  </RequireAuth>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
