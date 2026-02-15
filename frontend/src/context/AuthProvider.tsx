import {
  AuthContext,
  type AuthContextType,
  type ValidationError,
} from "./AuthContext";

import { useState, useEffect, ReactNode, useCallback } from "react";

import apiClient from "../api/client"; // Axios instance for making API calls to backend
import axios from "axios";

// define generic error message for auth operations to avoid revealing sensitive info
const genericErrorMessage = "An error occurred. Please try again.";

// Transform backend user object: rename _id to id for consistency with frontend conventions
// This abstracts MongoDB implementation details from the rest of the application
const transformUser = (user: { _id: string; name: string; email: string }) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [token, setToken] = useState<string | null>(() => {
    // On initial load, check localStorage for token to persist login across page reloads
    return localStorage.getItem("token");
  });
  const [loading, setLoading] = useState<boolean>(() => {
    // On initial load, we are only loading while we check for token to fetch user data
    return !!localStorage.getItem("token");
  });
  const [error, setError] = useState<{
    message: string;
    errors?: Array<ValidationError>;
  } | null>(null);

  // GetCurrentUser: Call GET /api/auth/me with JWT to fetch current user data, hydrate on app load
  const getCurrentUser = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!token) {
      setLoading(false);
      return; // No token means we can't fetch user data, so just return early
    }

    try {
      // Call backend to get current user data
      const response = await apiClient.get("/auth/me"); // we don't need to pass the token here because apiClient already includes it in the Authorization header

      const { user } = response.data; // Extract user data from response
      setUser(transformUser(user)); // Update state with user data
    } catch (error) {
      setToken(null);
      setUser(null);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || genericErrorMessage;
        const validationErrors = error.response?.data?.errors;
        setError({
          message,
          ...(validationErrors && { errors: validationErrors }),
        });
      } else {
        setError({ message: genericErrorMessage });
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Login: Call POST /api/auth/login with email/password, store token/user in state and localStorage
  const login = async (email: string, password: string) => {
    setLoading(true); // Set loading to true at the start of the login process - show spinner / prevent other requests
    setError(null); // clear previous errors before a new login attempt - otherwise old error messages would persist when trying to login again after a failure

    // try-catch block to handle async API call and potential errors
    try {
      // make api call to backend login endpoint with email and password
      const response = await apiClient.post("/auth/login", { email, password });
      // on success, backend returns { token, user }
      const { token, user } = response.data; // extract token and user data from response
      // store token in localStorage for persistence across page reloads
      localStorage.setItem("token", token);
      // update state with token and user data
      setToken(token);
      setUser(transformUser(user));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Check if the error is an AxiosError to safely access response data
        const message = error.response?.data?.message || genericErrorMessage; // Try to get error message from backend response // Fallback message if backend doesn't provide one

        const validationErrors = error.response?.data?.errors; // Try to get validation errors array from backend response

        setError({
          message,
          ...(validationErrors && { errors: validationErrors }),
        });
      } else {
        setError({ message: genericErrorMessage });
      }
    } finally {
      setLoading(false); // Set loading to false at the end of the login process - hide spinner / allow other requests
    }
  };

  // Logout function: Calls backend to clear refresh token cookie, then clears local auth state
  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post("/auth/logout"); // Call backend to clear refresh token cookie
      localStorage.removeItem("token"); // Clear token from localStorage
      setToken(null); // Clear token from state
      setUser(null); // Clear user data from state
    } catch (error) {
      // Even if logout API call fails, we still want to clear local auth state to log the user out on the frontend
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);

      // Check if the error is an AxiosError to safely access response data
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || genericErrorMessage; // Try to get error message from backend response // Fallback message if backend doesn't provide one
        const validationErrors = error.response?.data?.errors;
        setError({
          message,
          ...(validationErrors && { errors: validationErrors }),
        });
      } else {
        setError({ message: genericErrorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  // Register: Call POST /api/auth/register with name/email/passwords, store token/user in state and localStorage
  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post("/auth/register", {
        name,
        email,
        password,
      });
      // on success, backend returns { token, user }
      const { token, user } = response.data; // extract token and user data from response
      // store token in localStorage for persistence across page reloads
      localStorage.setItem("token", token);
      // update state with token and user data
      setToken(token);
      setUser(transformUser(user));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Check if the error is an AxiosError to safely access response data
        const message = error.response?.data?.message || genericErrorMessage; // Try to get error message from backend response // Fallback message if backend doesn't provide one
        const validationErrors = error.response?.data?.errors;
        setError({
          message,
          ...(validationErrors && { errors: validationErrors }),
        });
      } else {
        setError({ message: genericErrorMessage });
      }
    } finally {
      setLoading(false); // Set loading to false at the end of the login process - hide spinner / allow other requests
    }
  };

  // UpdatePassword: Call PATCH /auth/update-password with current and new password
  // Password is NOT in JWT, so no token regeneration needed - just throw on error and let component handle it
  const updatePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    try {
      await apiClient.patch("/auth/update-password", {
        currentPassword,
        newPassword,
      });
      // On success, don't update state - password change doesn't affect JWT (password not in payload)
      // Component will handle the success message
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || genericErrorMessage;
        const validationErrors = error.response?.data?.errors;
        throw {
          message,
          ...(validationErrors && { errors: validationErrors }),
        };
      } else {
        throw { message: genericErrorMessage };
      }
    }
  };

  // UpdateEmail: Call PATCH /auth/update-email with new email and password for verification
  // Email IS in JWT, so backend returns new tokens - need to update localStorage and context
  const updateEmail = async (newEmail: string, password: string) => {
    try {
      const response = await apiClient.patch("/auth/update-email", {
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
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || genericErrorMessage;
        const validationErrors = error.response?.data?.errors;
        throw {
          message,
          ...(validationErrors && { errors: validationErrors }),
        };
      } else {
        throw { message: genericErrorMessage };
      }
    }
  };

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
  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
