var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx } from "react/jsx-runtime";
import { AuthContext, } from "./AuthContext";
import { useState, useEffect, useCallback } from "react";
import apiClient from "../api/client"; // Axios instance for making API calls to backend
import axios from "axios";
// Define generic error message for auth operations to avoid revealing sensitive info
const genericErrorMessage = "An error occurred. Please try again.";
// Transform backend user object: rename _id to id for consistency with frontend conventions
// This abstracts MongoDB implementation details from the rest of the application
const transformUser = (user) => {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
    };
};
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => {
        // On initial load, check localStorage for token to persist login across page reloads
        return localStorage.getItem("token");
    });
    const [loading, setLoading] = useState(() => {
        // On initial load, we are only loading while we check for token to fetch user data
        return !!localStorage.getItem("token");
    });
    const [error, setError] = useState(null);
    // GetCurrentUser: Call GET /api/auth/me with JWT to fetch current user data, hydrate on app load
    const getCurrentUser = useCallback(() => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        setLoading(true);
        setError(null);
        if (!token) {
            setLoading(false);
            return; // No token means we can't fetch user data, so just return early
        }
        try {
            // Call backend to get current user data
            const response = yield apiClient.get("/auth/me"); // We don't need to pass the token here because apiClient already includes it in the Authorization header
            const { user } = response.data; // Extract user data from response
            setUser(transformUser(user)); // Update state with user data
        }
        catch (error) {
            setToken(null);
            setUser(null);
            if (axios.isAxiosError(error)) {
                const message = ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || genericErrorMessage;
                const validationErrors = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.errors;
                setError(Object.assign({ message }, (validationErrors && { errors: validationErrors })));
            }
            else {
                setError({ message: genericErrorMessage });
            }
        }
        finally {
            setLoading(false);
        }
    }), [token]);
    // Login: Call POST /api/auth/login with email/password, store token/user in state and localStorage
    const login = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        setLoading(true); // Set loading to true at the start of the login process - show spinner / prevent other requests
        setError(null); // Clear previous errors before a new login attempt - otherwise old error messages would persist when trying to login again after a failure
        // try-catch block to handle async API call and potential errors
        try {
            // Make API call to backend login endpoint with email and password
            const response = yield apiClient.post("/auth/login", { email, password });
            // On success, backend returns { token, user }
            const { token, user } = response.data; // Extract token and user data from response
            // Store token in localStorage for persistence across page reloads
            localStorage.setItem("token", token);
            // Update state with token and user data
            setToken(token);
            setUser(transformUser(user));
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                // Check if the error is an AxiosError to safely access response data
                const message = ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || genericErrorMessage; // Try to get error message from backend response // Fallback message if backend doesn't provide one
                const validationErrors = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.errors; // Try to get validation errors array from backend response
                setError(Object.assign({ message }, (validationErrors && { errors: validationErrors })));
            }
            else {
                setError({ message: genericErrorMessage });
            }
        }
        finally {
            setLoading(false); // Set loading to false at the end of the login process - hide spinner / allow other requests
        }
    });
    // Logout function: Calls backend to clear refresh token cookie, then clears local auth state
    const logout = () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        setLoading(true);
        setError(null);
        try {
            yield apiClient.post("/auth/logout"); // Call backend to clear refresh token cookie
            localStorage.removeItem("token"); // Clear token from localStorage
            setToken(null); // Clear token from state
            setUser(null); // Clear user data from state
        }
        catch (error) {
            // Even if logout API call fails, we still want to clear local auth state to log the user out on the frontend
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
            // Check if the error is an AxiosError to safely access response data
            if (axios.isAxiosError(error)) {
                const message = ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || genericErrorMessage; // Try to get error message from backend response // Fallback message if backend doesn't provide one
                const validationErrors = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.errors;
                setError(Object.assign({ message }, (validationErrors && { errors: validationErrors })));
            }
            else {
                setError({ message: genericErrorMessage });
            }
        }
        finally {
            setLoading(false);
        }
    });
    // Register: Call POST /api/auth/register with name/email/passwords, store token/user in state and localStorage
    const register = (name, email, password) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        setLoading(true);
        setError(null);
        try {
            const response = yield apiClient.post("/auth/register", {
                name,
                email,
                password,
            });
            // On success, backend returns { token, user }
            const { token, user } = response.data; // Extract token and user data from response
            // store token in localStorage for persistence across page reloads
            localStorage.setItem("token", token);
            // Update state with token and user data
            setToken(token);
            setUser(transformUser(user));
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                // Check if the error is an AxiosError to safely access response data
                const message = ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || genericErrorMessage; // Try to get error message from backend response // Fallback message if backend doesn't provide one
                const validationErrors = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.errors;
                setError(Object.assign({ message }, (validationErrors && { errors: validationErrors })));
            }
            else {
                setError({ message: genericErrorMessage });
            }
        }
        finally {
            setLoading(false); // Set loading to false at the end of the login process - hide spinner / allow other requests
        }
    });
    // UpdatePassword: Call PATCH /auth/update-password with current and new password
    // Password is NOT in JWT, so no token regeneration needed - just throw on error and let component handle it
    const updatePassword = (currentPassword, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            yield apiClient.patch("/auth/update-password", {
                currentPassword,
                newPassword,
            });
            // On success, don't update state - password change doesn't affect JWT (password not in payload)
            // Component will handle the success message
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                const message = ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || genericErrorMessage;
                const validationErrors = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.errors;
                throw Object.assign({ message }, (validationErrors && { errors: validationErrors }));
            }
            else {
                throw { message: genericErrorMessage };
            }
        }
    });
    // UpdateEmail: Call PATCH /auth/update-email with new email and password for verification
    // Email IS in JWT, so backend returns new tokens - need to update localStorage and context
    const updateEmail = (newEmail, password) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            const response = yield apiClient.patch("/auth/update-email", {
                newEmail,
                password,
            });
            // On success, backend returns new token and updated user object
            const { token: newToken, user } = response.data;
            // Update localStorage with new token
            localStorage.setItem("token", newToken);
            // Update state with new token and updated user data
            setToken(newToken);
            setUser(transformUser(user));
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                const message = ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || genericErrorMessage;
                const validationErrors = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.errors;
                throw Object.assign({ message }, (validationErrors && { errors: validationErrors }));
            }
            else {
                throw { message: genericErrorMessage };
            }
        }
    });
    // ClearError: Resets the error state to null.
    // We use useCallback to memoize this function so that it doesn't cause unnecessary re-renders in components that depend on it, since it will be stable across renders.
    const clearError = useCallback(() => {
        setError(null);
    }, []);
    // Whenever the token changes (e.g. on login), fetch the current user data to hydrate the app with user info
    useEffect(() => {
        if (token) {
            getCurrentUser();
        }
    }, [token, getCurrentUser]); // Depends on token - runs when token changes
    // Provider component: Exposes auth state and functions to all child components via context
    return (_jsx(AuthContext.Provider, { value: {
            user,
            token,
            loading,
            error,
            login,
            logout,
            register,
            getCurrentUser,
            updatePassword,
            updateEmail,
            clearError,
        }, children: children }));
};
