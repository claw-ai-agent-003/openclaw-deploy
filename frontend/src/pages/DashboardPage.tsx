import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

interface Deployment {
  id: string;
  slug: string;
  status: 'PENDING' | 'PROVISIONING' | 'RUNNING' | 'FAILED';
  url?: string;
  error?: string;
  createdAt: string;
}

function StatusBadge({ status }: { status: Deployment['status'] }) {
  const classes: Record<Deployment['status'], string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PROVISIONING: 'bg-blue-100 text-blue-800',
    RUNNING: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes[status]}`}>
      {status}
    </span>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ username: string; email: string | null; avatarUrl: string } | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
    fetchDeployments();
  }, []);

  async function fetchUser() {
    try {
      const res = await axios.get('/api/auth/me', { withCredentials: true });
      setUser(res.data);
    } catch {
      navigate('/login');
    }
  }

  async function fetchDeployments() {
    try {
      const res = await axios.get('/api/users/me/deployments', { withCredentials: true });
      setDeployments(res.data.deployments);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await axios.post('/api/auth/logout', {}, { withCredentials: true });
    navigate('/login');
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this deployment?')) return;
    setDeleting(id);
    try {
      await axios.delete(`/api/users/me/deployments/${id}`, { withCredentials: true });
      setDeployments((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">OpenClaw</h1>
              {user && (
                <div className="flex items-center gap-2 ml-4">
                  <img src={user.avatarUrl} alt={user.username} className="w-8 h-8 rounded-full" />
                  <span className="text-sm text-gray-600">@{user.username}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                + Deploy New
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Deployments</h2>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : deployments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-500 mb-4">No deployments yet.</p>
            <Link to="/" className="text-green-600 hover:text-green-700 font-medium">
              Create your first deployment →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {deployments.map((d) => (
              <div key={d.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-sm font-medium text-gray-900 truncate">{d.slug}</span>
                    <StatusBadge status={d.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {d.url && (
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 truncate">
                        {d.url}
                      </a>
                    )}
                    {d.error && <span className="text-red-500 truncate">{d.error}</span>}
                    <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(d.id)}
                  disabled={deleting === d.id}
                  className="flex-shrink-0 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {deleting === d.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
