import axios from "axios";
import { localApi } from "./localStore";

export const isStaticMode = import.meta.env.VITE_STATIC_MODE === "true";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
  timeout: 10000,
});

export const getHealth = async () => {
  if (isStaticMode) return localApi.getHealth();
  const response = await apiClient.get("/api/health");
  return response.data;
};

export const getStatsSummary = async () => {
  if (isStaticMode) return localApi.getStatsSummary();
  const response = await apiClient.get("/api/stats/summary");
  return response.data;
};

export const getSettings = async () => {
  if (isStaticMode) return localApi.getSettings();
  const response = await apiClient.get("/api/settings");
  return response.data;
};

export const updateSettings = async (payload) => {
  if (isStaticMode) return localApi.updateSettings(payload);
  const response = await apiClient.put("/api/settings", payload);
  return response.data;
};

export const getReports = async ({ page = 1, pageSize = 20, status } = {}) => {
  if (isStaticMode) return localApi.getReports({ page, pageSize, status });
  const response = await apiClient.get("/api/reports", {
    params: {
      page,
      page_size: pageSize,
      ...(status && status !== "all" ? { status } : {}),
    },
  });
  return response.data;
};

export const getReport = async (id) => {
  if (isStaticMode) return localApi.getReport(id);
  const response = await apiClient.get(`/api/reports/${id}`);
  return response.data;
};

export const createReport = async (payload) => {
  if (isStaticMode) return localApi.createReport(payload);
  const response = await apiClient.post("/api/reports", payload);
  return response.data;
};

export const updateReport = async (id, payload) => {
  if (isStaticMode) return localApi.updateReport(id, payload);
  const response = await apiClient.put(`/api/reports/${id}`, payload);
  return response.data;
};

export const deleteReport = async (id) => {
  if (isStaticMode) return localApi.deleteReport(id);
  const response = await apiClient.delete(`/api/reports/${id}`);
  return response.data;
};

export const updateReportStatus = async (id, status) => {
  if (isStaticMode) return localApi.updateReportStatus(id, status);
  const response = await apiClient.patch(`/api/reports/${id}/status`, { status });
  return response.data;
};

export const uploadInvoice = async ({ reportId, tripId, expenseCategory, file }) => {
  if (isStaticMode) return localApi.uploadInvoice({ reportId, tripId, expenseCategory, file });
  const formData = new FormData();
  formData.append("report_id", reportId);
  formData.append("expense_category", expenseCategory);
  if (tripId) {
    formData.append("trip_id", tripId);
  }
  formData.append("file", file);
  const response = await apiClient.post("/api/invoices/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateInvoice = async (id, payload) => {
  if (isStaticMode) return localApi.updateInvoice(id, payload);
  const response = await apiClient.put(`/api/invoices/${id}`, payload);
  return response.data;
};

export const deleteInvoice = async (id) => {
  if (isStaticMode) return localApi.deleteInvoice(id);
  const response = await apiClient.delete(`/api/invoices/${id}`);
  return response.data;
};

export const getInvoiceFileUrl = (id) =>
  isStaticMode ? localApi.getInvoiceFileUrl(id) : `${apiClient.defaults.baseURL}/api/invoices/${id}/file`;

export const getReportPdfUrl = (id) => `${apiClient.defaults.baseURL}/api/reports/${id}/pdf`;
