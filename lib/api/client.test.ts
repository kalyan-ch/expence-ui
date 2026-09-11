import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from './client';

const fetchMock = vi.fn();

function response(body: BodyInit | null, init: ResponseInit) {
  return Promise.resolve(new Response(body, init));
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:8080');
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('apiFetch', () => {
  it('returns the typed JSON body of a 2xx and prefixes the API base URL', async () => {
    fetchMock.mockReturnValue(
      response(JSON.stringify({ id: 'a1', name: 'Checking' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await apiFetch<{ id: string; name: string }>('/accounts');

    expect(result).toEqual({ id: 'a1', name: 'Checking' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:8080/api/accounts');
    expect(new Headers(init.headers).get('Content-Type')).toBe('application/json');
  });

  it('resolves to undefined for a 204', async () => {
    fetchMock.mockReturnValue(response(null, { status: 204 }));

    await expect(apiFetch('/accounts/a1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('throws an ApiError carrying status, message and fieldErrors for a 400', async () => {
    fetchMock.mockReturnValue(
      response(
        JSON.stringify({
          message: 'Validation failed',
          errors: { name: 'must not be blank' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const error = await apiFetch('/accounts', { method: 'POST' }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.message).toBe('Validation failed');
    expect(error.fieldErrors).toEqual({ name: 'must not be blank' });
  });

  it('throws an ApiError, not a SyntaxError, when a 500 body is not JSON', async () => {
    fetchMock.mockReturnValue(
      response('<html>Internal Server Error</html>', {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }),
    );

    const error = await apiFetch('/accounts').catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).not.toBeInstanceOf(SyntaxError);
    expect(error.status).toBe(500);
    expect(error.message).toBeTruthy();
    expect(error.fieldErrors).toBeUndefined();
  });

  it('throws an ApiError with a 409 conflict message', async () => {
    fetchMock.mockReturnValue(
      response(JSON.stringify({ message: "Account 'Checking' has 42 transactions" }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const error = await apiFetch('/accounts/a1', { method: 'DELETE' }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
    expect(error.message).toBe("Account 'Checking' has 42 transactions");
  });
});
