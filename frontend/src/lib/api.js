import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  headers: { "Content-Type": "application/json" },
});

// Folders
export const getFolders = () => api.get("/folders");

// Content Items
export const getContentItems = (params) => api.get("/content/items", { params });
export const getContentItem = (id) => api.get(`/content/items/${id}`);
export const createContentItem = (data) => api.post("/content/items", data);
export const updateContentItem = (id, data) => api.put(`/content/items/${id}`, data);
export const deleteContentItem = (id) => api.delete(`/content/items/${id}`);

// Export
export const exportSinglePackage = (itemId) => api.get(`/content/export-package/${itemId}`);
export const bulkExportPackages = (params) => api.get("/content/bulk-export", { params });

// YouTube
export const analyzeYouTube = (data) => api.post("/youtube/analyze", data);

// Voice
export const transcribeVoice = (formData) =>
  api.post("/voice/transcribe", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  });

// Content Package
export const generatePackage = (itemId) => api.post(`/content/generate-package/${itemId}`);
export const getPackage = (itemId) => api.get(`/content/package/${itemId}`);

// Marketing DNA
export const getMarketingDNA = () => api.get("/settings/marketing-dna");
export const updateMarketingDNA = (data) => api.put("/settings/marketing-dna", data);

// Search
export const smartSearch = (q) => api.get("/search", { params: { q } });

// Daily Snack
export const getDailySnack = () => api.get("/daily-snack");

// History
export const getHistory = (params) => api.get("/history", { params });

// Backup
export const exportFullBackup = () => api.get("/backup/export");
export const restoreFromBackup = (data) => api.post("/backup/restore", { data });

export default api;
