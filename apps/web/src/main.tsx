import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './auth/AuthContext.tsx';
import { RequireAuth } from './auth/RequireAuth.tsx';
import Admin from './routes/Admin.tsx';
import Dashboard from './routes/Dashboard.tsx';
import Login from './routes/Login.tsx';
import Register from './routes/Register.tsx';
import Team from './routes/Team.tsx';
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
              path="/team"
              element={
                <RequireAuth kind="user">
                  <Team />
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
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
