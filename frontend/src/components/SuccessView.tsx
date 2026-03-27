import { useState } from 'react';

interface Props {
  url: string;
  password: string;
  onReset: () => void;
}

export function SuccessView({ url, password, onReset }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.checkmark}>✓</div>
      <h2 style={styles.title}>Your deployment is ready!</h2>

      <div style={styles.urlBox}>
        <a href={url} target="_blank" rel="noopener noreferrer" style={styles.url}>
          {url}
        </a>
        <button onClick={copyUrl} style={styles.copyButton}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {password && (
        <div style={styles.credentials}>
          <p style={styles.credentialsLabel}>Admin Password</p>
          <p style={styles.password}>{password}</p>
          <p style={styles.credentialsNote}>
            Save this password — it's only shown once
          </p>
        </div>
      )}

      <a href={url} target="_blank" rel="noopener noreferrer">
        <button style={styles.primaryButton}>Open Dashboard</button>
      </a>

      <a href="/dashboard">
        <button style={styles.secondaryButton}>Go to Dashboard</button>
      </a>

      <button onClick={onReset} style={styles.tertiaryButton}>
        Deploy Another
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    textAlign: 'center',
    padding: '48px 16px',
    maxWidth: '480px',
    width: '100%',
  },
  checkmark: {
    width: '64px',
    height: '64px',
    backgroundColor: '#dcfce7',
    color: '#16a34a',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: '700',
    margin: '0 auto 24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 24px',
  },
  urlBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  url: {
    flex: 1,
    fontSize: '14px',
    color: '#111827',
    textDecoration: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  copyButton: {
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    cursor: 'pointer',
    flexShrink: 0,
  },
  credentials: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fcd34d',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
  },
  credentialsLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#92400e',
    margin: '0 0 4px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  password: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
    fontFamily: 'monospace',
    wordBreak: 'break-all',
  },
  credentialsNote: {
    fontSize: '12px',
    color: '#92400e',
    margin: '8px 0 0',
  },
  primaryButton: {
    display: 'block',
    width: '100%',
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
    backgroundColor: '#16a34a',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textDecoration: 'none',
    marginBottom: '12px',
  },
  secondaryButton: {
    display: 'block',
    width: '100%',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    textDecoration: 'none',
    marginBottom: '12px',
  },
  tertiaryButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
};
