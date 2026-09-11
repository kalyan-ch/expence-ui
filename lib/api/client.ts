/** Error carrying the API's `{message, errors?}` body. */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const API_BASE_PATH = '/api';

// Falls back to the local API so a fresh clone works before anyone writes .env.local
// (it is git-ignored). See .env.example.
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

/**
 * Fetches `${NEXT_PUBLIC_API_URL}/api${path}` with JSON headers.
 * Throws `ApiError` on a non-2xx; resolves to `undefined` for a 204.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // Headers, not an object spread: a spread silently drops a `Headers` instance and
  // mangles the array form. FormData sets its own multipart boundary, so leave it alone.
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type') && !(init?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_ORIGIN}${API_BASE_PATH}${path}`, { ...init, headers });

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function toApiError(response: Response): Promise<ApiError> {
  // A 500 may return HTML or an empty body, so a parse failure is not fatal.
  const body = await response.json().catch(() => null);
  const message =
    body && typeof body.message === 'string' ? body.message : `Request failed (${response.status})`;
  const fieldErrors =
    body && body.errors && typeof body.errors === 'object'
      ? (body.errors as Record<string, string>)
      : undefined;
  return new ApiError(response.status, message, fieldErrors);
}
