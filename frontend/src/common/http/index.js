import axios from "axios";

import { appConfig } from "../config";
import { authServices } from "../../auth";

const http = axios.create({
  baseURL: appConfig.BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use(
  (config) => {
    const accessToken = authServices.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error("session expired!");
    if (error.response.status === 401 && !error.config._retry) {
      const refreshToken = authServices.getRefreshToken();
      if (!refreshToken) {
        window.location.replace("/login");
      }
      const { accessToken } = await authServices.login({ refreshToken });
      if (!accessToken) {
        window.location.replace("/login");
      }
      error.config.headers.Authorization = `Bearer ${accessToken}`;
      return axios(error.config);
    }
  }
);

export { http };
