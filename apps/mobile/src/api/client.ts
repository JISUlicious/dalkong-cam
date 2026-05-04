import { apiBaseUrl } from "@/lib/config";
import { tokenStore } from "@/auth/tokenStore";

interface FetchOpts extends Omit<RequestInit, "body"> {
  body?: unknown;
  retryOn401?: boolean;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { body, headers, retryOn401 = true, ...rest } = opts;
  const accessToken = tokenStore.getAccessToken();
  const finalHeaders: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
    ...(headers as Record<string, string> | undefined),
  };
  if (accessToken) finalHeaders.authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${apiBaseUrl}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 401 && retryOn401) {
    const refreshed = await tokenStore.tryRefresh();
    if (refreshed) {
      return api<T>(path, { ...opts, retryOn401: false });
    }
  }

  if (!res.ok) {
    let errorBody: { error?: string; message?: string; details?: unknown } = {};
    try {
      errorBody = (await res.json()) as typeof errorBody;
    } catch {
      /* ignore */
    }
    throw new ApiError(
      res.status,
      errorBody.error ?? `http_${res.status}`,
      errorBody.message ?? res.statusText,
      errorBody.details,
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export { ApiError };
