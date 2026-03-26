import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SuccessView } from '../../src/components/SuccessView';

const mockClipboard = {
  writeText: vi.fn(),
};
Object.assign(navigator, { clipboard: mockClipboard });

describe('SuccessView', () => {
  it('renders the URL', () => {
    render(<SuccessView url="https://abc12345.deploy.openclaw.com/" password="testpass" onReset={vi.fn()} />);

    expect(screen.getByText('https://abc12345.deploy.openclaw.com/')).toBeInTheDocument();
  });

  it('renders the password', () => {
    render(<SuccessView url="https://abc12345.deploy.openclaw.com/" password="secretpass123" onReset={vi.fn()} />);

    expect(screen.getByText('secretpass123')).toBeInTheDocument();
  });

  it('renders the Open Dashboard button', () => {
    render(<SuccessView url="https://abc12345.deploy.openclaw.com/" password="testpass" onReset={vi.fn()} />);

    expect(screen.getByRole('link', { name: /Open Dashboard/i })).toHaveAttribute(
      'href',
      'https://abc12345.deploy.openclaw.com/'
    );
  });

  it('renders the Deploy Another button', () => {
    render(<SuccessView url="https://abc12345.deploy.openclaw.com/" password="testpass" onReset={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Deploy Another/i })).toBeInTheDocument();
  });

  it('calls onReset when Deploy Another is clicked', async () => {
    const onReset = vi.fn();
    render(<SuccessView url="https://abc12345.deploy.openclaw.com/" password="testpass" onReset={onReset} />);

    await screen.getByRole('button', { name: /Deploy Another/i }).click();

    expect(onReset).toHaveBeenCalled();
  });
});
