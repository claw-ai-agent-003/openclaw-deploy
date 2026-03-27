import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DeployForm } from './components/DeployForm';
import { StatusView } from './components/StatusView';
import { SuccessView } from './components/SuccessView';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { useState, useEffect } from 'react';
import axios from 'axios';

type View = 'form' | 'polling' | 'success' | 'error';

function DeployPage() {
  const [view, setView] = useState<View>('form');
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    axios.get('/api/auth/me', { withCredentials: true })
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false));
  }, []);

  if (isLoggedIn === null) return null;
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Please <a href="/login" className="text-blue-600 hover:underline">sign in</a> first.</p>
      </div>
    );
  }

  function handleDeploy(id: string) {
    setDeploymentId(id);
    setView('polling');
  }

  function handleSuccess(resultUrl: string, resultPassword: string) {
    setUrl(resultUrl);
    setPassword(resultPassword);
    setView('success');
  }

  function handleError(message: string) {
    setError(message);
    setView('error');
  }

  function handleReset() {
    setDeploymentId(null);
    setUrl(null);
    setPassword(null);
    setError(null);
    setView('form');
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>OpenClaw</h1>
        <p style={styles.tagline}>One-click cloud deployment</p>
        <a href="/dashboard" style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
          → Dashboard
        </a>
      </header>

      <main style={styles.main}>
        {view === 'form' && (
          <DeployForm onDeploy={handleDeploy} onError={handleError} />
        )}

        {view === 'polling' && deploymentId && (
          <StatusView
            deploymentId={deploymentId}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        )}

        {view === 'success' && url && password !== null && (
          <SuccessView url={url} password={password} onReset={handleReset} />
        )}

        {view === 'success' && url && password === null && (
          <SuccessView url={url} password="" onReset={handleReset} />
        )}

        {view === 'error' && (
          <div style={styles.errorContainer}>
            <p style={styles.errorMessage}>{error}</p>
            <button style={styles.retryButton} onClick={handleReset}>
              Try Again
            </button>
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <p>Deploy OpenClaw to your own cloud server in under 3 minutes</p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#f9fafb',
  },
  header: {
    textAlign: 'center',
    padding: '48px 16px 32px',
  },
  logo: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
  },
  tagline: {
    fontSize: '18px',
    color: '#6b7280',
    margin: '8px 0 0',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 16px',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '48px 16px',
    maxWidth: '400px',
    width: '100%',
  },
  errorMessage: {
    color: '#dc2626',
    fontSize: '16px',
    marginBottom: '24px',
  },
  retryButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#111827',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  footer: {
    textAlign: 'center',
    padding: '24px 16px',
    color: '#9ca3af',
    fontSize: '14px',
  },
};

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DeployPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
