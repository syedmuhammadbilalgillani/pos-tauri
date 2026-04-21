import { API_URL } from "@/constants";

type ApiHeadersOptions = {
  token?: string | null;
  headers?: HeadersInit;
};

export function buildApiHeaders(options: ApiHeadersOptions = {}): Headers {
  const { token, headers } = options;
  const finalHeaders = new Headers(headers);

  if (!finalHeaders.has("Accept"))
    finalHeaders.set("Accept", "application/json");
  if (!finalHeaders.has("Content-Type"))
    finalHeaders.set("Content-Type", "application/json");

  // Optional bearer token support
  if (token) finalHeaders.set("Authorization", `Bearer ${token}`);

  return finalHeaders;
}

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export type ApiRequestConfig = Omit<
  RequestInit,
  "headers" | "body" | "method"
> & {
  token?: string | null;
  headers?: HeadersInit;
  params?: QueryParams;
  body?: BodyInit | Record<string, unknown> | null;

  /**
   * If true, do not throw on non-2xx. Log only and return `data: null as T`.
   * Use this for bootstrap/background calls where you don't want UI to break.
   */
  silent?: boolean;

  /** Internal: prevent refresh loops. Do not set manually. */
  _skipRefresh?: boolean;
};

export type ApiResponse<T> = {
  data: T;
  status: number;
  headers: Headers;
};

export class ApiError<T = unknown> extends Error {
  status: number;
  data?: T;

  constructor(message: string, status: number, data?: T) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function withQueryParams(url: string, params?: QueryParams): string {
  if (!params) return url;
  const sp = new URLSearchParams();

  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) sp.set(k, String(v));
  }

  const qs = sp.toString();
  if (!qs) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${qs}`;
}

function normalizeBodyAndHeaders(
  body: ApiRequestConfig["body"],
  headers: Headers,
): BodyInit | undefined {
  if (body == null) return undefined;

  if (body instanceof FormData) {
    headers.delete("Content-Type");
    return body;
  }

  if (
    typeof body === "string" ||
    body instanceof Blob ||
    body instanceof URLSearchParams
  ) {
    return body;
  }

  return JSON.stringify(body);
}

async function parseResponseBody<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json"))
    return (await response.json()) as T;
  return (await response.text()) as T;
}

function resolveUrl(url: string, baseURL?: string): string {
  if (!baseURL) return url;
  if (/^https?:\/\//i.test(url)) return url;

  const normalizedBase = baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL;
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${normalizedBase}${normalizedPath}`;
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (typeof body === "object" && body !== null) {
    if (
      "message" in body &&
      typeof (body as { message?: unknown }).message === "string"
    ) {
      return (body as { message: string }).message;
    }
  }
  if (typeof body === "string" && body.trim()) return body;
  return fallback || "Request failed";
}

async function refreshCustomerSession(baseURL?: string): Promise<boolean> {
  const refreshUrl = resolveUrl("/users/pos/refresh", baseURL);

  const res = await fetch(refreshUrl, {
    method: "POST",
    credentials: "include",
    headers: buildApiHeaders(),
  });

  if (res.ok) return true;

  try {
    const body = await parseResponseBody<unknown>(res);
    console.log("[api] refresh failed", res.status, body);
  } catch {
    console.log("[api] refresh failed", res.status);
  }
  return false;
}

function logApiError(args: {
  requestUrl: string;
  method: string;
  status: number;
  responseBody: unknown;
}) {
  const { requestUrl, method, status, responseBody } = args;
  console.warn("[api] request failed", {
    method,
    status,
    requestUrl,
    responseBody,
  });
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  config: ApiRequestConfig = {},
  baseURL?: string,
): Promise<ApiResponse<T>> {
  const {
    token,
    headers,
    params,
    body,
    credentials,
    silent,
    _skipRefresh,
    ...rest
  } = config;

  const requestUrl = withQueryParams(resolveUrl(url, baseURL), params);
  const finalHeaders = buildApiHeaders({ token, headers });
  const requestBody = normalizeBodyAndHeaders(body, finalHeaders);

  const doFetch = async () => {
    const response = await fetch(requestUrl, {
      ...rest,
      method,
      headers: finalHeaders,
      body: requestBody,
      credentials: credentials ?? "include",
    });
    const responseBody = await parseResponseBody<unknown>(response);
    return { response, responseBody };
  };

  let { response, responseBody } = await doFetch();

  // Auto-refresh on 401, once
  if (response.status === 401 && !_skipRefresh) {
    const refreshed = await refreshCustomerSession(baseURL);
    if (refreshed) {
      ({ response, responseBody } = await doFetch());
    }
  }

  if (!response.ok) {
    const message = extractErrorMessage(responseBody, response.statusText);

    if (silent) {
      logApiError({
        requestUrl,
        method,
        status: response.status,
        responseBody,
      });
      return {
        data: null as T,
        status: response.status,
        headers: response.headers,
      };
    }

    // throw new ApiError(message, response.status, responseBody);
    console.log(message, "message");
  }

  return {
    data: responseBody as T,
    status: response.status,
    headers: response.headers,
  };
}

export function createApiClient(baseURL?: string) {
  return {
    get: <T>(url: string, config?: ApiRequestConfig) =>
      request<T>("GET", url, config, baseURL),

    post: <T>(
      url: string,
      body?: ApiRequestConfig["body"],
      config?: ApiRequestConfig,
    ) => request<T>("POST", url, { ...config, body }, baseURL),

    put: <T>(
      url: string,
      body?: ApiRequestConfig["body"],
      config?: ApiRequestConfig,
    ) => request<T>("PUT", url, { ...config, body }, baseURL),

    patch: <T>(
      url: string,
      body?: ApiRequestConfig["body"],
      config?: ApiRequestConfig,
    ) => request<T>("PATCH", url, { ...config, body }, baseURL),

    delete: <T>(url: string, config?: ApiRequestConfig) =>
      request<T>("DELETE", url, config, baseURL),
  };
}

export const apiClient = createApiClient(API_URL);
