var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from "axios";
// Create an Axios instance with default configuration
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL, // Base URL for the backend API
    withCredentials: true, // Include cookies in requests for refresh token handling
});
// Request interceptor to include the JWT token in the Authorization header for all requests
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    // If a token exists, include it in the Authorization header of the request
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // Return the modified config
}, (error) => {
    // Handle request errors, Promise.reject propogates the error up the chain
    return Promise.reject(error);
});
// Response interceptor: Handle errors, especially 401 (expired token)
apiClient.interceptors.response.use((response) => {
    // This runs on SUCCESS (status 200-299) so we just pass the response through unchanged
    return response;
}, (error) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // This runs on ERROR (status 400-599)
    // Prevent infinite loops by checking a custom _retry flag on the request config
    if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 401 && !error.config._retry) {
        // If we receive a 401 Unauthorized response, the token is likely invalid or expired
        // Don't retry auth endpoints - 401 there means credentials/validation failure
        // so we should not attempt to refresh the token
        const requestUrl = error.config.url;
        if ((requestUrl === null || requestUrl === void 0 ? void 0 : requestUrl.includes("/auth/login")) ||
            (requestUrl === null || requestUrl === void 0 ? void 0 : requestUrl.includes("/auth/register")) ||
            (requestUrl === null || requestUrl === void 0 ? void 0 : requestUrl.includes("/auth/refresh"))) {
            return Promise.reject(error); // Let the error bubble up
        }
        try {
            // Attempt to refresh the token
            const response = yield apiClient.post("/auth/refresh");
            const { token } = response.data; // Extract new token from response
            localStorage.setItem("token", token); // Store new token in localStorage
            // Update the Authorization header with new token and retry the original request
            error.config.headers.Authorization = `Bearer ${token}`;
            error.config._retry = true; // Mark the request as retried to avoid infinite loops
            return apiClient(error.config); // Retry the original request with new token
        }
        catch (refreshError) {
            // If refresh fails, the refresh token is also expired - user must login again
            localStorage.removeItem("token"); // Clear invalid token from localStorage
            window.location.href = "/login"; // Redirect to login page - we cant use navigate() here as we are outside React context
            return Promise.reject(refreshError);
        }
    }
    return Promise.reject(error); // Pass error along for non-401 errors
}));
export default apiClient;
