import { type LeadFilters, toApiParams } from '../features/sales/leads/filters';
import type { Advisor, LeadListResponse, SessionInfo, TransferSuccess } from './types';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

function buildQuery(params: Record<string, string>): string {
  const search = new URLSearchParams(params);
  return search.toString();
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    let body: { code?: string; message?: string } = {};
    try {
      body = (await response.json()) as { code?: string; message?: string };
    } catch {
      body = {};
    }
    const message = body.message ?? '请求失败（HTTP ' + response.status + '）';
    throw new ApiError(message, body.code ?? 'UNKNOWN', response.status);
  }
  return (await response.json()) as T;
}

export const leadsApi = {
  fetchSession(): Promise<SessionInfo> {
    return request<SessionInfo>('/api/me');
  },

  fetchAdvisors(): Promise<Advisor[]> {
    return request<Advisor[]>('/api/users?role=advisor');
  },

  fetchLeads(filters: LeadFilters): Promise<LeadListResponse> {
    return request<LeadListResponse>('/api/sales/leads?' + buildQuery(toApiParams(filters)));
  },

  transferLead(id: string, ownerId: string): Promise<TransferSuccess> {
    return request<TransferSuccess>('/api/sales/leads/' + id + '/owner', {
      method: 'PATCH',
      body: JSON.stringify({ ownerId }),
    });
  },
};
