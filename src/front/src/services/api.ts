import { ApiError, type ApiErrorResponse } from '../types/api';

const rawBaseUrl = import.meta.env.VITE_API_URL as string | undefined;
const API_BASE_URL = (rawBaseUrl ?? 'http://localhost:5000').replace(/\/+$/, '');

interface RequestOptions extends RequestInit {
  query?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { query, headers, body, ...rest } = options;
  const url = buildUrl(path, query);

  const mergedHeaders = new Headers(headers);
  if (body !== undefined && !(body instanceof FormData) && !mergedHeaders.has('Content-Type')) {
    mergedHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...rest,
    headers: mergedHeaders,
    body,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : await response.text().catch(() => '');

  if (!response.ok) {
    const errorData = (typeof payload === 'object' && payload !== null
      ? payload
      : undefined) as ApiErrorResponse | undefined;

    const message =
      errorData?.message ||
      errorData?.detail ||
      errorData?.title ||
      (typeof payload === 'string' && payload.trim() ? payload : `Erro na requisição (${response.status})`);

    throw new ApiError(message, response.status, errorData);
  }

  return payload as T;
}

export const api = {
  baseUrl: API_BASE_URL,
  get: <T>(path: string, query?: RequestOptions['query']) =>
    request<T>(path, { method: 'GET', query }),
  post: <T>(path: string, data?: unknown, query?: RequestOptions['query']) =>
    request<T>(path, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
      query,
    }),
  put: <T>(path: string, data?: unknown, query?: RequestOptions['query']) =>
    request<T>(path, {
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
      query,
    }),
  patch: <T>(path: string, data?: unknown, query?: RequestOptions['query']) =>
    request<T>(path, {
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : undefined,
      query,
    }),
  delete: <T>(path: string, query?: RequestOptions['query']) =>
    request<T>(path, { method: 'DELETE', query }),
};