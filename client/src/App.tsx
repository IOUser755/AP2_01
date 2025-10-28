import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { Helmet } from 'react-helmet-async';
import ProtectedRoute from './components/common/ProtectedRoute.tsx';
import LoadingSpinner from './components/common/LoadingSpinner.tsx';
import ErrorFallback from './components/common/ErrorFallback.tsx';
import { useAuth } from './hooks/useAuth.ts';
import { useTheme } from './hooks/useTheme.ts';

const LoginPage = React.lazy(() => import('./pages/auth/LoginPage.tsx'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage.tsx'));
const ForgotPasswordPage = React.lazy(() => import('./pages/auth/ForgotPasswordPage.tsx'));
const DashboardPage = React.lazy(() => import('./pages/dashboard/DashboardPage.tsx'));
const AgentsPage = React.lazy(() => import('./pages/agents/AgentsPage.tsx'));
const AgentBuilderPage = React.lazy(() => import('./pages/agents/AgentBuilderPage.tsx'));
const AgentDetailsPage = React.lazy(() => import('./pages/agents/AgentDetailsPage.tsx'));
const TransactionsPage = React.lazy(() => import('./pages/transactions/TransactionsPage.tsx'));
const TransactionDetailsPage = React.lazy(() => import('./pages/transactions/TransactionDetailsPage.tsx'));
const MarketplacePage = React.lazy(() => import('./pages/marketplace/MarketplacePage.tsx'));
const IntegrationsPage = React.lazy(() => import('./pages/integrations/IntegrationsPage.tsx'));
const AnalyticsPage = React.lazy(() => import('./pages/analytics/AnalyticsPage.tsx'));
const SettingsPage = React.lazy(() => import('./pages/settings/SettingsPage.tsx'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage.tsx'));

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`app ${theme}`}>
      <Helmet>
        <title>AgentPay Hub - Agentic Payment Platform</title>
        <meta
          name="description"
          content="Build, deploy, and manage AI payment agents with visual workflows"
        />
        <meta name="theme-color" content="#3b82f6" />
      </Helmet>

      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onError={(error, errorInfo) => {
          console.error('Application error:', error, errorInfo);
        }}
      >
        <Suspense fallback={<LoadingSpinner size="lg" />}>
          <Routes>
            <Route
              path="/login"
              element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" replace />}
            />
            <Route
              path="/register"
              element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" replace />}
            />
            <Route
              path="/forgot-password"
              element={!isAuthenticated ? <ForgotPasswordPage /> : <Navigate to="/dashboard" replace />}
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agents"
              element={
                <ProtectedRoute>
                  <AgentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agents/new"
              element={
                <ProtectedRoute>
                  <AgentBuilderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agents/:id"
              element={
                <ProtectedRoute>
                  <AgentDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agents/:id/edit"
              element={
                <ProtectedRoute>
                  <AgentBuilderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <TransactionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions/:id"
              element={
                <ProtectedRoute>
                  <TransactionDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketplace"
              element={
                <ProtectedRoute>
                  <MarketplacePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/integrations"
              element={
                <ProtectedRoute>
                  <IntegrationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

export default App;
