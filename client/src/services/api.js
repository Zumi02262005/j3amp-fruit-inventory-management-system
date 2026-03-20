import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginRequest = error.config.url.includes("/auth/login");
      if (!isLoginRequest) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ---- Auth API ----
export const authAPI = {
  login: (username, password) => api.post("/auth/login", { username, password }),
  logout: () => api.post("/auth/logout"),
  verifyToken: () => api.get("/auth/verify"),
  getCurrentUser: () => api.get("/auth/me"),
};

// ---- Inventory API ----
export const inventoryAPI = {
  getInventory: () => api.get("/inventory"),
  getBatches: (sku) => api.get(`/inventory/batches/${sku}`),
  getInventoryTotal: () => api.get("/inventory/total"),
  getInventoryCategories: () => api.get("/inventory/categories"),
  getExpiringBatches: () => api.get("/inventory/expiring"),
  getLowStockQuantity: () => api.get("/inventory/low-stock"),
  getLowStockItems: () => api.get("/inventory/low-stock-items"),
  getExpiringItems: () => api.get("/inventory/expiring-items"),
  getExpiredItems: () => api.get("/inventory/expired-items"),
  getExpiredCount: () => api.get("/inventory/expired-count"),
  autoExpireBatches: () => api.post("/inventory/auto-expire"),
  getSkuDropdown: () => api.get("/inventory/sku-dropdown"),
  getSkuDropdownDispatch: () => api.get("/inventory/sku-dropdown/dispatch"),
};

// ---- Transaction API ----
export const transactionAPI = {
  receiveStock: (data) => api.post("/transactions/receive", data),
  dispatchStock: (data) => api.post("/transactions/dispatch", data),
  getAllTransactions: () => api.get("/transactions/get-all-transactions"),
};

// ---- Logs API ----
export const logsAPI = {
  recentActivity: () => api.get("/logs/recent-activity"),
  recentReceipts: () => api.get("/logs/recent-receipts"),
  recentDispatches: () => api.get("/logs/recent-dispatches"),
  allActivities: () => api.get("/logs/all-activities"),
};

// ---- User API ----
export const userAPI = {
  getAllUsers: () => api.get("/users"),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post("/users", data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deactivateUser: (id) => api.patch(`/users/${id}/deactivate`),
  reactivateUser: (id) => api.patch(`/users/${id}/reactivate`),
  resetUserPassword: (id, data) => api.patch(`/users/${id}/reset-password`, data),
  getUserActivityLogs: (id) => api.get(`/users/${id}/logs`),
  getAllActivityLogs: () => api.get("/users/logs"),
  getOwnProfile: () => api.get("/users/profile/me"),
  updateOwnProfile: (data) => api.put("/users/profile/me", data),
  changeOwnPassword: (data) => api.patch("/users/profile/change-password", data),
  getOwnActivityLogs: () => api.get("/users/profile/my-logs"),
};

// ---- Alerts API ----
export const alertAPI = {
  getActiveAlerts: () => api.get("/alerts/active"),
  getAlertCount: () => api.get("/alerts/count"),
  getAllAlerts: () => api.get("/alerts"),
  generateAlerts: () => api.post("/alerts/generate"),
  clearAlert: (id) => api.patch(`/alerts/${id}/clear`),
  clearAllAlerts: () => api.patch("/alerts/clear-all"),
};

export default api;