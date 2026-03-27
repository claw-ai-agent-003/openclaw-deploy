import axios from 'axios';

const API_BASE = '/api';

export interface MeResponse {
  id: string;
  username: string;
  email: string | null;
  avatarUrl: string;
}

export async function getMe(): Promise<MeResponse> {
  const response = await axios.get<MeResponse>(`${API_BASE}/auth/me`, {
    withCredentials: true,
  });
  return response.data;
}

export async function logout(): Promise<void> {
  await axios.post(`${API_BASE}/auth/logout`, {}, { withCredentials: true });
}
