/**
 * API Service - Handle all backend API calls
 * Includes authentication token management and common API utilities
 */

const API_BASE_URL = "http://localhost:8000";

// ─── TOKEN MANAGEMENT ───────────────────────────────────────────────────────

/**
 * Get stored authentication token from localStorage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem("authToken");
};

/**
 * Save authentication token to localStorage
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem("authToken", token);
};

/**
 * Clear authentication token (logout)
 */
export const clearAuthToken = (): void => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("userEmail");
};

// ─── AUTH API CALLS ─────────────────────────────────────────────────────────

/**
 * Login user with email and password
 * @param email - User email
 * @param password - User password
 * @returns Access token and token type
 */
export const login = async (
  email: string,
  password: string
): Promise<{ access_token: string; token_type: string }> => {
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

  const data = await response.json();
  return data;
};

/**
 * Register new user
 * @param email - User email
 * @param password - User password
 * @returns Newly created user
 */
export const register = async (
  email: string,
  password: string
): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Registration failed");
  }

  const data = await response.json();
  return data;
};

/**
 * Get current authenticated user
 * @returns Current user object
 */
export const getCurrentUser = async (): Promise<any> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_BASE_URL}/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }

  const data = await response.json();
  return data;
};

/**
 * Check backend health
 */
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
};

// ─── GENERIC API CALL HELPER ────────────────────────────────────────────────

/**
 * Generic API call helper with authentication
 * Automatically adds Bearer token to requests
 * @param endpoint - API endpoint (e.g., "/orders")
 * @param method - HTTP method (GET, POST, etc.)
 * @param body - Request body (optional)
 * @returns Response data
 */
export const apiCall = async (
  endpoint: string,
  method: string = "GET",
  body?: any
): Promise<any> => {
  const token = getAuthToken();
  const headers: any = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const options: any = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || `API call failed: ${response.statusText}`);
  }

  return response.json();
};
