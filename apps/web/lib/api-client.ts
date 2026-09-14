const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface ApiResponseEnvelope<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    total_pages?: number;
    timestamp?: string;
  };
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  code: string;
  details?: unknown;

  constructor(message: string, code: string = "API_ERROR", details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponseEnvelope<T>> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${cleanEndpoint}`;

  const authHeaders: Record<string, string> = {};
  if (typeof window !== "undefined") {
    try {
      // 1. Tab-isolated session storage is the authoritative source of truth
      const activeRole = sessionStorage.getItem("resolvex_active_role");
      const activeUserStr = sessionStorage.getItem("resolvex_active_user");
      const activeToken = sessionStorage.getItem("resolvex_session_token");
      const tabId = sessionStorage.getItem("resolvex_tab_id");

      if (activeRole) {
        authHeaders["X-User-Role"] = activeRole;
        authHeaders["Authorization"] = activeToken ? `Bearer ${activeToken}` : `Bearer dev-${activeRole}`;
      }

      if (activeUserStr) {
        try {
          const parsed = JSON.parse(activeUserStr);
          if (parsed?.id) authHeaders["X-User-Id"] = parsed.id;
          if (parsed?.email) authHeaders["X-User-Email"] = parsed.email;
          if (parsed?.orgId) authHeaders["X-Org-Id"] = parsed.orgId;
        } catch {}
      }

      if (tabId) {
        authHeaders["X-Tab-Id"] = tabId;
      }
    } catch {}
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...options.headers,
      },
    });

    const json = await res.json();

    if (!res.ok) {
      const err = json as ApiErrorEnvelope;
      throw new ApiError(
        err.error?.message || `API error ${res.status}`,
        err.error?.code || `HTTP_${res.status}`,
        err.error?.details
      );
    }

    return json as ApiResponseEnvelope<T>;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    const msg = err instanceof Error ? err.message : "Network error or API unreachable";
    throw new ApiError(msg, "NETWORK_ERROR");
  }
}
