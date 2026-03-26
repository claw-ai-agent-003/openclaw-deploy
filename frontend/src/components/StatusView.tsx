import { useEffect, useRef } from 'react';
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
  const passwordRef = useRef<string | null>(null);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    function poll() {
      const elapsed = Date.now() - startTime.current;

      if (elapsed > TIMEOUT_MS) {
        onError("This is taking longer than expected — we'll email you when it's ready");
        return;
      }

      getStatus(deploymentId)
        .then((status) => {
          if (status.status === 'RUNNING' && status.url) {
            onSuccess(status.url, passwordRef.current || '');
          } else if (status.status === 'FAILED') {
            onError(
              status.error || 'Deployment failed — please try again'
            );
          }
          // PENDING or PROVISIONING → keep polling
        })
        .catch((err) => {
          const axiosErr = err as { response?: { data?: { error?: string } } };
          onError(
            axiosErr.response?.data?.error ||
              'Failed to check deployment status'
          );
        });
    }

    // Store password when we get it from a future endpoint (not yet implemented)
    // For now, the user will see it on the success page

    intervalId = setInterval(poll, POLL_INTERVAL);
    poll(); // immediate first check

    return () => clearInterval(intervalId);
  }, [deploymentId, onSuccess, onError]);

  const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div style={styles.container}>
      <div style={styles.spinner} />
      <p style={styles.message}>Setting up your deployment...</p>
      <p style={styles.time}>
        {minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}
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
