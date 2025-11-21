import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearSessionAndRedirect } from "./AuthSession";

// Configuración base de Axios
const api = axios.create({
  baseURL: "https://sgdis.cloud/",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("userToken");
  if (token) {
    config.headers = config.headers || {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";
    const isAuthEndpoint = requestUrl.includes("api/v1/auth/");

    if ((status === 401 || status === 403) && !isAuthEndpoint) {
      await clearSessionAndRedirect();
    }
    return Promise.reject(error);
  }
);

export default api;
