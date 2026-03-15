import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await window.Clerk?.session?.getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error or server unreachable
      return Promise.reject(new Error("Network error. Please try again."));
    }

    const { status } = error.response;

    if (status === 401) {
      // Let the UI handle sign-out — Clerk's ProtectedRoute will redirect
      window.Clerk?.signOut();
    }

    return Promise.reject(error);
  },
);

export default apiClient;
