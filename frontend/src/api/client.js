import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8001",
  headers: { "Content-Type": "application/json" },
});

export default api;

export const positionsApi = {
  list: () => api.get("/positions/").then((r) => r.data),
  get: (id) => api.get(`/positions/${id}`).then((r) => r.data),
  create: (data) => api.post("/positions/", data).then((r) => r.data),
  update: (id, data) => api.patch(`/positions/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/positions/${id}`),
  addEntry: (id, entry) => api.post(`/positions/${id}/entries`, entry).then((r) => r.data),
  deleteEntry: (posId, entryId) => api.delete(`/positions/${posId}/entries/${entryId}`),
  market: (id) => api.get(`/positions/${id}/market`).then((r) => r.data),
  verifyTicker: (ticker) => api.get(`/positions/verify/${ticker}`).then((r) => r.data),
};

export const signalsApi = {
  list: (positionId) => api.get(`/signals/${positionId}`).then((r) => r.data),
};

export const notificationsApi = {
  list: () => api.get("/notifications/").then((r) => r.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.patch("/notifications/read-all"),
};
