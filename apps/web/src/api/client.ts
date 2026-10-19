import { ApiResponse } from '@finpilot/shared';
import { handleMockRequest } from './mockBackend';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

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

// Track whether the remote backend is operational
let remoteBackendAvailable: boolean | null = null;

export function isUsingInBrowserEngine(): boolean {
  return remoteBackendAvailable === false;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // If remote backend was previously verified to be unavailable (e.g. static Vercel deployment),
  // directly serve from In-Browser Deterministic Engine for zero-latency instant response.
  if (remoteBackendAvailable === false) {
    return handleMockRequest<T>(endpoint, options);
  }

  const token = localStorage.getItem('finpilot_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    const contentType = response.headers.get('content-type') || '';

    // If endpoint returns HTML (such as Vercel SPA rewrites routing /api/* to index.html)
    // or returns a 404/502/503 from an absent backend:
    if (contentType.includes('text/html') || response.status === 404 || response.status >= 502) {
      console.warn(
        `[FinPilot] Remote API endpoint (${endpoint}) returned HTTP ${response.status} (${contentType}). Seamlessly switching to In-Browser Deterministic Engine.`
      );
      remoteBackendAvailable = false;
      return handleMockRequest<T>(endpoint, options);
    }

    // Handle CSV export download
    if (contentType.includes('text/csv')) {
      remoteBackendAvailable = true;
      return (await response.text()) as any;
    }

    const result: ApiResponse<T> = await response.json().catch(() => ({
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Unable to parse API response.',
      },
    }));

    if (!response.ok || !result.success) {
      // If server returned 404 or bad gateway in JSON:
      if (response.status === 404 || response.status >= 502) {
        remoteBackendAvailable = false;
        return handleMockRequest<T>(endpoint, options);
      }
      throw new ApiError(
        result.error?.message || 'A request error occurred.',
        result.error?.code || 'REQUEST_FAILED',
        result.error?.details
      );
    }

    remoteBackendAvailable = true;
    return result.data as T;
  } catch (err: any) {
    // If it's already an ApiError from application logic (e.g. wrong password, duplicate budget), rethrow
    if (err instanceof ApiError) {
      throw err;
    }

    // Network error (Failed to fetch, connection refused, CORS failure, offline)
    console.warn(
      `[FinPilot] Network unreachable for (${endpoint}). Seamlessly activating In-Browser Deterministic Engine.`
    );
    remoteBackendAvailable = false;
    return handleMockRequest<T>(endpoint, options);
  }
}
