import { ApiResponse } from '@finpilot/shared';

const API_BASE = '/api';

export class ApiError extends Error {
  code: string;
  details?: Record<string, string[]>;

  constructor(message: string, code: string = 'ERROR', details?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('finpilot_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Handle CSV export download
  if (response.headers.get('content-type')?.includes('text/csv')) {
    return (await response.text()) as any;
  }

  const result: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    error: {
      code: 'NETWORK_ERROR',
      message: 'Unable to connect to the FinPilot service. Please verify your connection.',
    },
  }));

  if (!response.ok || !result.success) {
    throw new ApiError(
      result.error?.message || 'A request error occurred.',
      result.error?.code || 'REQUEST_FAILED',
      result.error?.details
    );
  }

  return result.data as T;
}
