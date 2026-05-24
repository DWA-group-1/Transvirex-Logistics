/**
 * API Service — all backend calls go through here.
 * Single source of truth for the base URL and auth headers.
 */

// Change this once if the backend port ever changes — nowhere else needs updating.
const API_BASE_URL = "http://localhost:8002";

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserOut {
  id: number;
  email: string;
  role: "driver" | "dispatcher" | "billing" | "manager";
}

// ─── TOKEN MANAGEMENT ───────────────────────────────────────────────────────

export const getAuthToken = (): string | null =>
  localStorage.getItem("authToken");

export const setAuthToken = (token: string): void =>
  localStorage.setItem("authToken", token);

export const clearAuthToken = (): void => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
};

/**
 * Decode the JWT payload (no signature verification — that's the backend's job).
 * Returns null if the token is missing or malformed.
 */
export const decodeTokenPayload = (): Record<string, any> | null => {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

/** Returns the current user's role from the stored JWT, or null if not logged in. */
export const getCurrentRole = (): UserOut["role"] | null => {
  const payload = decodeTokenPayload();
  return (payload?.role as UserOut["role"]) ?? null;
};

/** True when a valid token is present (does not re-validate with the server). */
export const isAuthenticated = (): boolean => {
  const payload = decodeTokenPayload();
  if (!payload?.exp) return false;
  return payload.exp * 1000 > Date.now();
};

// ─── AUTH API CALLS ─────────────────────────────────────────────────────────

/**
 * Login — returns and stores the access token.
 */
export const login = async (
  email: string,
  password: string
): Promise<TokenResponse> => {
  const formData = new FormData();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(`${API_BASE_URL}/token`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Login failed");
  }

  const data: TokenResponse = await response.json();
  setAuthToken(data.access_token);

  // Cache role so UI can gate features without an extra round-trip
  const payload = decodeTokenPayload();
  if (payload?.role) localStorage.setItem("userRole", payload.role);
  if (payload?.email) localStorage.setItem("userEmail", payload.email);

  return data;
};

/**
 * Register a new worker account.
 * Requires a manager JWT — the backend will reject the request otherwise.
 */
export const register = async (
  email: string,
  password: string,
  role: UserOut["role"]
): Promise<UserOut> => {
  const token = getAuthToken();
  if (!token) throw new Error("You must be logged in as a manager to create accounts.");

  const response = await fetch(`${API_BASE_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, password, role }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Registration failed");
  }

  return response.json();
};

/**
 * Fetch the profile of the currently authenticated user.
 */
export const getCurrentUser = async (): Promise<UserOut> => {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(`${API_BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Failed to fetch user");
  return response.json();
};

export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
};

// ─── GENERIC AUTHENTICATED HELPER ───────────────────────────────────────────

export const apiCall = async (
  endpoint: string,
  method = "GET",
  body?: unknown
): Promise<any> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || `API call failed: ${response.statusText}`);
  }

  return response.json();
};