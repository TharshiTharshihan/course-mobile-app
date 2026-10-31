import axios from "axios";
import { API_URL } from "./config";

let authToken = null;
export const setToken = (t) => {
  authToken = t;
};
export const getAuthToken = () => authToken;

const api = axios.create({ baseURL: `${API_URL}/api`, timeout: 60000 });

api.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

// A 401 on any call except login means the saved session is no longer valid (expired token,
// account removed, admin moved to the database...). Flag the error so screens stay quiet,
// and let AuthContext sign out back to the login screen.
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || "";
    if (error.response?.status === 401 && !url.startsWith("/auth/login")) {
      error.sessionExpired = true;
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export const fileUrl = (fileName) => `${API_URL}/uploads/${encodeURIComponent(fileName)}`;

export default api;
