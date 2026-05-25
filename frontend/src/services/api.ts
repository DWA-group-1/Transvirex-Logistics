const API_BASE_URL = "http://localhost:8000";

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserOut {
  id: number;
  email: string;
  role: "driver" | "dispatcher" | "billing" | "manager";
}

export const getAuthToken = (): string | null =>
  localStorage.getItem("authToken");

export const setAuthToken = (token: string): void =>
  localStorage.setItem("authToken", token);

export const clearAuthToken = (): void => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
};

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

export const getCurrentRole = (): UserOut["role"] | null => {
  const payload = decodeTokenPayload();
  return (payload?.role as UserOut["role"]) ?? null;
};

export const isAuthenticated = (): boolean => {
  const payload = decodeTokenPayload();
  if (!payload?.exp) return false;
  return payload.exp * 1000 > Date.now();
};

export const login = async (
  email: string,
  password: string
): Promise<TokenResponse> => {
  const formData = new FormData();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(`${API_BASE_URL}/auth/token`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Login failed");
  }

  const data: TokenResponse = await response.json();
  setAuthToken(data.access_token);

  const payload = decodeTokenPayload();
  if (payload?.role) localStorage.setItem("userRole", payload.role);
  if (payload?.email) localStorage.setItem("userEmail", payload.email);

  return data;
};

export const register = async (
  email: string,
  password: string,
  role: UserOut["role"]
): Promise<UserOut> => {
  const token = getAuthToken();
  if (!token) throw new Error("You must be logged in as a manager to create accounts.");

  const response = await fetch(`${API_BASE_URL}/auth/register`, {
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

export const getCurrentUser = async (): Promise<UserOut> => {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
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