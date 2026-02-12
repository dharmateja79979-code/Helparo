import type { ApiEnvelope } from "../types";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

if (!apiBaseUrl) {
  throw new Error("Missing VITE_API_BASE_URL");
}

export const callApi = async <T>(
  path: string,
  token: string,
  init?: RequestInit
): Promise<T> => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      ...(init?.headers ?? {})
    }
  });

  const envelope = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !envelope.success) {
    throw new Error(envelope.error?.message ?? `HTTP ${response.status}`);
  }
  return envelope.data as T;
};
