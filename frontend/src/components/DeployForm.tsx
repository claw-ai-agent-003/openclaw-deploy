import { useState, FormEvent } from 'react';
import { deploy } from '../api/deploy';

interface Props {
  onDeploy: (id: string) => void;
  onError: (message: string) => void;
}

export function DeployForm({ onDeploy, onError }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  function validate(): boolean {
    if (!apiKey.trim()) {
      setValidationError('Please enter your OpenClaw API key');
      return false;
    }
    if (apiKey.trim().length < 10) {
      setValidationError('API key must be at least 10 characters');
      return false;
    }
    setValidationError(null);
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await deploy(apiKey.trim(), email.trim() || undefined);
      onDeploy(result.id);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string; code?: string } } };
      const message =
        axiosErr.response?.data?.error ||
        'Deployment failed — please try again';
      onError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={styles.card}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label htmlFor="apiKey" style={styles.label}>
            OpenClaw API Key
          </label>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setValidationError(null);
            }}
            placeholder="sk-..."
            style={{
              ...styles.input,
              ...(validationError ? styles.inputError : {}),
            }}
            disabled={isLoading}
            autoComplete="off"
            spellCheck={false}
          />
          {validationError && (
            <p style={styles.fieldError}>{validationError}</p>
          )}
        </div>

        <div style={styles.field}>
          <label htmlFor="email" style={styles.label}>
            Email{' '}
            <span style={styles.optional}>(optional — for status updates)</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={styles.input}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            ...styles.button,
            ...(isLoading ? styles.buttonDisabled : {}),
          }}
        >
          {isLoading ? 'Deploying...' : 'Deploy Now'}
        </button>

        <p style={styles.note}>
          Your API key is only used to provision your deployment — never stored.
        </p>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  optional: {
    fontWeight: '400',
    color: '#9ca3af',
  },
  input: {
    padding: '12px 16px',
    fontSize: '16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  fieldError: {
    fontSize: '13px',
    color: '#dc2626',
    margin: 0,
  },
  button: {
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
    backgroundColor: '#16a34a',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
  },
  note: {
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'center',
    margin: 0,
  },
};
