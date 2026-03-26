import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeployForm } from '../../src/components/DeployForm';

const mockDeploy = vi.fn();
vi.mock('../../src/api/deploy', () => ({
  deploy: (...args: unknown[]) => mockDeploy(...args),
}));

describe('DeployForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form', () => {
    render(<DeployForm onDeploy={vi.fn()} onError={vi.fn()} />);

    expect(screen.getByLabelText(/OpenClaw API Key/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Deploy Now/i })).toBeInTheDocument();
  });

  it('shows validation error for empty key', async () => {
    const user = userEvent.setup();
    render(<DeployForm onDeploy={vi.fn()} onError={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Deploy Now/i }));

    expect(screen.getByText(/Please enter your OpenClaw API key/i)).toBeInTheDocument();
  });

  it('shows validation error for short key', async () => {
    const user = userEvent.setup();
    render(<DeployForm onDeploy={vi.fn()} onError={vi.fn()} />);

    await user.type(screen.getByLabelText(/OpenClaw API Key/i), 'sk-short');
    await user.click(screen.getByRole('button', { name: /Deploy Now/i }));

    expect(screen.getByText(/API key must be at least 10 characters/i)).toBeInTheDocument();
  });

  it('calls onDeploy with deployment id on success', async () => {
    const user = userEvent.setup();
    const onDeploy = vi.fn();
    mockDeploy.mockResolvedValue({ id: 'deploy-123' });

    render(<DeployForm onDeploy={onDeploy} onError={vi.fn()} />);

    await user.type(screen.getByLabelText(/OpenClaw API Key/i), 'sk-valid-key-1234567890');
    await user.click(screen.getByRole('button', { name: /Deploy Now/i }));

    expect(mockDeploy).toHaveBeenCalledWith('sk-valid-key-1234567890', undefined);
    expect(onDeploy).toHaveBeenCalledWith('deploy-123');
  });

  it('calls onError on deployment failure', async () => {
    const user = userEvent.setup();
    const onError = vi.fn();
    mockDeploy.mockRejectedValue({
      response: { data: { error: 'Invalid API key' } },
    });

    render(<DeployForm onDeploy={vi.fn()} onError={onError} />);

    await user.type(screen.getByLabelText(/OpenClaw API Key/i), 'sk-bad-key-1234567890');
    await user.click(screen.getByRole('button', { name: /Deploy Now/i }));

    expect(onError).toHaveBeenCalledWith('Invalid API key');
  });

  it('disables button while loading', async () => {
    const user = userEvent.setup();
    mockDeploy.mockImplementation(
      () => new Promise((r) => setTimeout(() => r({ id: 'deploy-123' }), 100))
    );

    render(<DeployForm onDeploy={vi.fn()} onError={vi.fn()} />);

    await user.type(screen.getByLabelText(/OpenClaw API Key/i), 'sk-valid-key-1234567890');
    await user.click(screen.getByRole('button', { name: /Deploy Now/i }));

    expect(screen.getByRole('button', { name: /Deploying.../i })).toBeDisabled();
  });
});
