import axios from 'axios';

const API_BASE = '/api/deploy';

export interface DeployResponse {
  id: string;
}

export interface StatusResponse {
  status: 'PENDING' | 'PROVISIONING' | 'RUNNING' | 'FAILED';
  url?: string;
  error?: string;
}

export async function deploy(apiKey: string, email?: string): Promise<DeployResponse> {
  const response = await axios.post<DeployResponse>(`${API_BASE}`, { apiKey, email });
  return response.data;
}

export async function getStatus(id: string): Promise<StatusResponse> {
  const response = await axios.get<StatusResponse>(`${API_BASE}/${id}/status`);
  return response.data;
}
