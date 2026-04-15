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

// AI Settings
export const getAISettings = () => api.get("/settings/ai");
export const updateAISettings = (data) => api.put("/settings/ai", data);

// Digital Guides Agent
export const generateGuide = (data) => api.post("/agents/generate-guide", data);
export const listGuides = () => api.get("/agents/guides");
export const getGuide = (id) => api.get(`/agents/guides/${id}`);
export const deleteGuide = (id) => api.delete(`/agents/guides/${id}`);

// Affiliate Agent
export const findAffiliates = (data) => api.post("/agents/find-affiliates", data);
export const listAffiliateSearches = () => api.get("/agents/affiliates");
export const deleteAffiliateSearch = (id) => api.delete(`/agents/affiliates/${id}`);

// Trend Agent
export const findTrends = (data) => api.post("/agents/find-trends", data);
export const listTrendSearches = () => api.get("/agents/trends");
export const deleteTrendSearch = (id) => api.delete(`/agents/trends/${id}`);

// Calendar Scheduling
export const createScheduledPost = (data) => api.post("/calendar/schedule", data);
export const listScheduledPosts = (month) => api.get("/calendar/schedule", { params: { month } });
export const deleteScheduledPost = (id) => api.delete(`/calendar/schedule/${id}`);
export const markScheduledDone = (id) => api.put(`/calendar/schedule/${id}/done`);

// Push Notifications
export const getVapidKey = () => api.get("/push/vapid-key");
export const pushSubscribe = (sub) => api.post("/push/subscribe", sub);
export const sendTestPush = () => api.post("/push/send-test");

// Smart Import
export const smartImport = (text) => api.post("/import/smart", { text });

// Strategist Agent
export const strategistChat = (message, session_id) => api.post("/agents/strategist/chat", { message, session_id });
export const listStrategistSessions = () => api.get("/agents/strategist/sessions");
export const getStrategistChat = (sessionId) => api.get(`/agents/strategist/chat/${sessionId}`);
export const deleteStrategistSession = (sessionId) => api.delete(`/agents/strategist/session/${sessionId}`);

export default api;
