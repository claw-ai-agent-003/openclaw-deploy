import { useEffect, useRef, useState } from 'react';
import { getStatus } from '../api/deploy';

interface Props {
  deploymentId: string;
  onSuccess: (url: string, password: string) => void;
  onError: (message: string) => void;
}

const POLL_INTERVAL = 2000;
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export function StatusView({ deploymentId, onSuccess, onError }: Props) {
  const startTime = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const passwordRef = useRef<string | null>(null);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    function poll() {
      const now = Date.now();
      const elapsedMs = now - startTime.current;
      setElapsed(elapsedMs);

      if (elapsedMs > TIMEOUT_MS) {
        onError("This is taking longer than expected — we'll email you when it's ready");
        return;
      }

      getStatus(deploymentId)
        .then((status) => {
          if (status.status === 'RUNNING' && status.url) {
            onSuccess(status.url, passwordRef.current || '');
          } else if (status.status === 'FAILED') {
            onError(status.error || 'Deployment failed — please try again');
          }
        })
        .catch((err) => {
          const axiosErr = err as { response?: { data?: { error?: string } } };
          onError(
            axiosErr.response?.data?.error || 'Failed to check deployment status'
          );
        });
    }

    intervalId = setInterval(poll, POLL_INTERVAL);
    poll();

    return () => clearInterval(intervalId);
  }, [deploymentId, onSuccess, onError]);

  const seconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div style={styles.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={styles.spinner} />
      <p style={styles.message}>Setting up your deployment...</p>
      <p style={styles.time}>
        {minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`}
      </p>
      <p style={styles.hint}>
        This usually takes under 2 minutes. You can close this tab — your
        deployment will continue in the background.
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    textAlign: 'center',
    padding: '48px 16px',
    maxWidth: '400px',
    width: '100%',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e5e7eb',
    borderTopColor: '#16a34a',
    borderRadius: '50%',
    margin: '0 auto 24px',
    animation: 'spin 1s linear infinite',
  },
  message: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 8px',
  },
  time: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: '0 0 16px',
  },
  hint: {
    fontSize: '13px',
    color: '#6b7280',
    margin: 0,
    lineHeight: 1.5,
  },
};
