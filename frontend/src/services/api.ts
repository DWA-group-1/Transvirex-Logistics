const API_BASE_URL = "http://localhost:8000";

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  must_change_password: boolean;  // ADD THIS LINE
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
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
};

export const getRefreshToken = (): string | null =>
  localStorage.getItem("refreshToken");

export const setRefreshToken = (token: string): void =>
  localStorage.setItem("refreshToken", token);

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
  const token = getAuthToken();
  if (!token) return false;

  try {
    const payload = decodeTokenPayload();
    if (!payload?.exp) return false;

    return payload.exp * 1000 > Date.now() + 10_000;
  } catch {
    return false;
  }
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
  setRefreshToken(data.refresh_token);

  const payload = decodeTokenPayload();

  if (payload?.role) localStorage.setItem("userRole", payload.role);
  if (payload?.email) localStorage.setItem("userEmail", payload.email);

  return data;  // Now includes must_change_password
};

//send refresh token to auth/token/revoke with POST verb
export const logout = async (): Promise<void> => {
  const token = getRefreshToken();
  if (!token) return;

  const response = await fetch(`${API_BASE_URL}/auth/token/revoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: token,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Logout failed: ${error}`);
  }
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
  body?: unknown,
  retry = true
): Promise<any> => {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && retry) {
    const newAccessToken = await refreshAccessToken();

    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        ...headers,
        Authorization: `Bearer ${newAccessToken}`,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  if (!response.ok) {
    let message = `API call failed: ${response.statusText}`;

    try {
      const error = await response.json();
      message = error.detail || message;
    } catch {
      // Ignore JSON parsing error
    }

    throw new Error(message);
  }

  return response.json();
};

export const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearAuthToken();
    throw new Error("No refresh token found");
  }

  const response = await fetch(`${API_BASE_URL}/auth/token/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    clearAuthToken();
    throw new Error("Session expired. Please log in again.");
  }

  const data: TokenResponse = await response.json();

  setAuthToken(data.access_token);

  if (data.refresh_token) {
    setRefreshToken(data.refresh_token);
  }

  return data.access_token;
};

// ADD THIS NEW FUNCTION for changing password
export const changePassword = async (
  newPassword: string,
  confirmPassword: string,
  currentPassword?: string
): Promise<{ message: string; must_change_password: boolean }> => {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      current_password: currentPassword || null,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to change password");
  }

  return response.json();
};