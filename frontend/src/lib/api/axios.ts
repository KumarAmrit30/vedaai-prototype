import axios from "axios";
import { API_BASE_URL } from "@/lib/constants";
import { useAuthStore } from "@/store/auth.store";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await useAuthStore.getState().getIdToken();

  if (token) {
    if (typeof config.headers.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export default apiClient;
