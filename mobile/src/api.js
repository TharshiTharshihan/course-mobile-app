import axios from "axios";
import { API_URL } from "./config";

let authToken = null;
export const setToken = (t) => {
  authToken = t;
};
export const getAuthToken = () => authToken;

const api = axios.create({ baseURL: `${API_URL}/api`, timeout: 20000 });

api.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

export const fileUrl = (fileName) => `${API_URL}/uploads/${encodeURIComponent(fileName)}`;

export default api;
