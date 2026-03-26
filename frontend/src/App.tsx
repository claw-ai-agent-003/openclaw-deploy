import { useState } from 'react';
import { DeployForm } from './components/DeployForm';
import { StatusView } from './components/StatusView';
import { SuccessView } from './components/SuccessView';

type View = 'form' | 'polling' | 'success' | 'error';

export function App() {
  const [view, setView] = useState<View>('form');
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleDeploy(id: string) {
    setDeploymentId(id);
    setView('polling');
  }

  function handleSuccess(url: string, password: string) {
    setUrl(url);
    setPassword(password);
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

        {view === 'success' && url && password && (
          <SuccessView url={url} password={password} onReset={handleReset} />
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
