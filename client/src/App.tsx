import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { DashboardLayout } from '@components/layout/DashboardLayout';
import { PublicLayout } from '@components/layout/PublicLayout';
import { ErrorBoundary } from '@components/common/ErrorBoundary';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { useAuth } from '@hooks/useAuth';

const LoginPage = React.lazy(() => import('@pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('@pages/auth/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('@pages/auth/ForgotPasswordPage'));
const DashboardPage = React.lazy(() => import('@pages/dashboard/DashboardPage'));
const AgentsPage = React.lazy(() => import('@pages/agents/AgentsPage'));
const AgentBuilderPage = React.lazy(() => import('@pages/agents/AgentBuilderPage'));
const AgentDetailsPage = React.lazy(() => import('@pages/agents/AgentDetailsPage'));
const TransactionsPage = React.lazy(() => import('@pages/transactions/TransactionsPage'));
const TransactionDetailsPage = React.lazy(() => import('@pages/transactions/TransactionDetailsPage'));
const MarketplacePage = React.lazy(() => import('@pages/marketplace/MarketplacePage'));
const IntegrationsPage = React.lazy(() => import('@pages/integrations/IntegrationsPage'));
const AnalyticsPage = React.lazy(() => import('@pages/analytics/AnalyticsPage'));
const SettingsPage = React.lazy(() => import('@pages/settings/SettingsPage'));
const NotFoundPage = React.lazy(() => import('@pages/NotFoundPage'));

interface RouteGuardProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: RouteGuardProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: RouteGuardProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <PublicLayout>
                  <LoginPage />
                </PublicLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <PublicLayout>
                  <RegisterPage />
                </PublicLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <PublicLayout>
                  <ForgotPasswordPage />
                </PublicLayout>
              </PublicRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/agents"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AgentsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/agents/new"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AgentBuilderPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/agents/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AgentDetailsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/agents/:id/edit"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AgentBuilderPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TransactionsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TransactionDetailsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketplace"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <MarketplacePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/integrations"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <IntegrationsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AnalyticsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default App;
