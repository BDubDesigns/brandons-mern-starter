import axios from "axios";
// Create an Axios instance with default configuration
const apiClient = axios.create({
  baseURL: "http://localhost:5000/api", // Base URL for the backend API
  withCredentials: true, // Include cookies in requests for refresh token handling
});

// Request interceptor to include the JWT token in the Authorization header for all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    // If a token exists, include it in the Authorization header of the request
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config; // Return the modified config
  },
  (error) => {
    // Handle request errors, Promise.reject propogates the error up the chain
    return Promise.reject(error);
  }
);

// Response interceptor: Handle errors, especially 401 (expired token)
apiClient.interceptors.response.use(
  (response) => {
    // This runs on SUCCESS (status 200-299) so we just pass the response through unchanged
    return response;
  },
  async (error) => {
    // This runs on ERROR (status 400-599)
    if (error.response?.status === 401 && !error.config._retry) {
      // If we receive a 401 Unauthorized response, the token is likely invalid or expired
      try {
        // Attempt to refresh the token
        const response = await apiClient.post("/auth/refresh");
        const { token } = response.data; // Extract new token from response
        localStorage.setItem("token", token); // Store new token in localStorage

        // Update the Authorization header with new token and retry the original request
        error.config.headers.Authorization = `Bearer ${token}`;
        error.config._retry = true; // Mark the request as retried to avoid infinite loops
        return apiClient(error.config); // Retry the original request with new token
      } catch (refreshError) {
        // If refresh fails, the refresh token is also expired - user must login again
        localStorage.removeItem("token"); // Clear invalid token from localStorage
        window.location.href = "/login"; // Redirect to login page - we cant use navigate() here as we are outside React context
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error); // Pass error along for non-401 errors
  }
);

export default apiClient;
