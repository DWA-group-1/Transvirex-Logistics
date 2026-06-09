const API_BASE_URL = "http://localhost:8000";

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  must_change_password: boolean;
}

export interface UserOut {
  id: string;
  email: string;
  role: "driver" | "dispatcher" | "billing" | "manager";
}

export interface DriverRef {
  id: string;
  auth_user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  hub_id: string | null;
  is_active: boolean;
}

export interface HubRef {
  id: string;
  code: string;
  name: string;
  address: string;
  capacity: number | null;
  is_active: boolean;
}

export interface CustomerRef {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  address: string;
  is_active: boolean;
}

export type DeliveryStatus =
  | "created"
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled";

export interface DeliveryEnriched {
  id: string;
  hub_id: string;
  customer_id: string;
  assigned_driver_id: string | null;
  pickup_address: string;
  delivery_address: string;
  city: string;
  zip_code: string;
  parcel_count: number;
  weight_kg: number | null;
  service_type: string;
  priority: string;
  status: DeliveryStatus;
  expected_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  driver: DriverRef | null;
  hub: HubRef | null;
  customer: CustomerRef | null;
  has_open_incident: boolean;
}

export interface DeliveryList {
  items: DeliveryEnriched[];
  total: number;
  limit: number;
  offset: number;
}

export interface DeliveryCreatePayload {
  hub_id: string;
  customer_id: string;
  pickup_address: string;
  delivery_address: string;
  city: string;
  zip_code: string;
  parcel_count?: number;
  weight_kg?: number | null;
  service_type: string;
  priority?: string;
  expected_date?: string | null;
  notes?: string | null;
}

export interface IncidentWithDelivery {
  id: string;
  delivery_id: string;
  type: string;
  description: string;
  severity: "low" | "medium" | "high";
  status: "open" | "resolved";
  resolution: string | null;
  created_at: string;
  updated_at: string;
  delivery_address: string | null;
  delivery_city: string | null;
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

export const getValidToken = async (): Promise<string | null> => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const payload = decodeTokenPayload();
    const isExpiredOrSoon =
      !payload?.exp || payload.exp * 1000 < Date.now() + 10_000;
    if (isExpiredOrSoon) {
      return await refreshAccessToken();
    }
    return token;
  } catch {
    return null;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getValidToken();
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
  password: string,
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

  return data;
};

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
  role: UserOut["role"],
): Promise<UserOut> => {
  const token = getAuthToken();
  if (!token)
    throw new Error("You must be logged in as a manager to create accounts.");

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
  retry = true,
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

export const changePassword = async (
  newPassword: string,
  confirmPassword: string,
  currentPassword?: string,
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

export const getDeliveries = async (params?: {
  status?: DeliveryStatus;
  limit?: number;
  offset?: number;
}): Promise<DeliveryList> => {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  const qs = q.toString();
  return apiCall(`/delivery/deliveries${qs ? `?${qs}` : ""}`);
};

export const createDelivery = async (
  payload: DeliveryCreatePayload,
): Promise<DeliveryEnriched> =>
  apiCall("/delivery/deliveries", "POST", payload);

export const assignDriver = async (
  deliveryId: string,
  driverId: string,
): Promise<DeliveryEnriched> =>
  apiCall(`/delivery/deliveries/${deliveryId}/assign`, "POST", {
    driver_id: driverId,
  });

export const pickupDelivery = (id: string) =>
  apiCall(`/delivery/deliveries/${id}/pickup`, "POST");
export const departDelivery = (id: string) =>
  apiCall(`/delivery/deliveries/${id}/depart`, "POST");
export const deliverDelivery = (id: string) =>
  apiCall(`/delivery/deliveries/${id}/deliver`, "POST");
export const cancelDelivery = (id: string) =>
  apiCall(`/delivery/deliveries/${id}/cancel`, "POST");

export const getMyDeliveries = async (params?: {
  status?: DeliveryStatus;
}): Promise<DeliveryList> => {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  const qs = q.toString();
  return apiCall(`/delivery/deliveries/mine${qs ? `?${qs}` : ""}`);
};

export const addTrackingNote = (
  deliveryId: string,
  body: { location?: string; notes?: string },
) => apiCall(`/delivery/deliveries/${deliveryId}/tracking`, "POST", body);

export const declareIncident = (
  deliveryId: string,
  body: { type: string; description: string; severity?: string },
) => apiCall(`/delivery/deliveries/${deliveryId}/incidents`, "POST", body);

export const getDrivers = async (
  hubId?: string,
): Promise<{ items: DriverRef[] }> =>
  apiCall(
    `/catalog/drivers?is_active=true&limit=100${hubId ? `&hub_id=${hubId}` : ""}`,
  );

export const getHubs = async (): Promise<{ items: HubRef[] }> =>
  apiCall("/catalog/hubs?is_active=true&limit=100");

export const getCustomers = async (): Promise<{ items: CustomerRef[] }> =>
  apiCall("/catalog/customers?is_active=true&limit=100");

export const createCustomer = async (payload: {
  name: string;
  contact_name?: string | null;
  email?: string | null;
  address: string;
}): Promise<CustomerRef> => apiCall("/catalog/customers", "POST", payload);

export const createHub = async (payload: {
  code: string;
  name: string;
  address: string;
  capacity?: number | null;
}): Promise<HubRef> => apiCall("/catalog/hubs", "POST", payload);

export const deactivateCustomer = (id: string) =>
  apiCall(`/catalog/customers/${id}`, "DELETE");

export const deactivateHub = (id: string) =>
  apiCall(`/catalog/hubs/${id}`, "DELETE");

export const getIncidents = async (params?: {
  status?: "open" | "resolved";
}): Promise<IncidentWithDelivery[]> => {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  const qs = q.toString();
  return apiCall(`/delivery/incidents${qs ? `?${qs}` : ""}`);
};

export const resolveIncident = (incidentId: string, resolution: string) =>
  apiCall(`/delivery/incidents/${incidentId}/resolve`, "POST", { resolution });

export const registerWorker = async (payload: {
  email: string;
  password: string;
  role: "dispatcher" | "billing" | "manager";
}): Promise<UserOut> => apiCall("/auth/register", "POST", payload);

export const createDriver = async (payload: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  hub_id?: string | null;
}): Promise<DriverRef> => apiCall("/catalog/drivers", "POST", payload);

export interface KpiValues {
  period_month: string;
  total_deliveries: number;
  on_time_pct: number | null;
  avg_delivery_time_h: number | null;
  customer_satisfaction: number | null;
  revenue: number;
  active_drivers: number;
  incidents_count: number;
  source: string; // "live" | "computed" | "seeded"
}

export interface KpiTrend {
  months: KpiValues[];
}

export const getCurrentKpis = (): Promise<KpiValues> =>
  apiCall("/reporting/kpi/current");

export const getKpiTrend = (months = 12): Promise<KpiTrend> =>
  apiCall(`/reporting/kpi/trend?months=${months}`);
