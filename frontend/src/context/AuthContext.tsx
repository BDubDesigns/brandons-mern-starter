import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

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

// Define an interface for the error state to include optional array of errors
interface ValidationError {
  type: string;
  msg: string;
  path: string;
  location: string;
}

// Define the shape of our AuthContext state and functions using TypeScript interfaces
// This ensures that any component using useAuth() knows exactly what data/functions are available
interface AuthContextType {
  // User data fetched from backend - null means not logged in
  user: { id: string; name: string; email: string } | null;
  // JWT token stored in localStorage - used for authenticated API requests
  token: string | null;
  // loading state while fetching from backend (prevent race conditions)
  loading: boolean;
  // error messages from failed auth operations (display to user)
  error: { message: string; errors?: Array<ValidationError> } | null;
  // Functions that components will call to interact with auth
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<void>;
  // Hydrate user on app load (fetch current user from /api/auth/me)
  getCurrentUser: () => Promise<void>;
}
// Create the AuthContext - this is what we'll wrap the entire app with
// undefined as initial value - AuthProvider will replace it with actual values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{
    message: string;
    errors?: Array<ValidationError>;
  } | null>(null);
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
        const message =
          error.response?.data?.message || // Try to get error message from backend response
          genericErrorMessage; // Fallback message if backend doesn't provide one

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

  // On app load, check if there's a token in localStorage and try to fetch current user
  useEffect(() => {
    // On load, loading is true while we check for token and fetch user data, which prevents protected routes from redirecting to login page before we know if the user is authenticated or not
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      // Set token from localStorage - this will trigger the getCurrentUser useEffect to fetch user data and hydrate the app with user info
      setToken(savedToken); // getCurrentUser will be called which will set loading to false after it finishes fetching user data, so we don't set loading to false here - we want to wait until we know if the token is valid and we have user data before we stop loading
    } else {
      setLoading(false); // No token means we can stop loading and show unauthenticated state (e.g. login page)
    }
  }, []); // Empty dependency array means this runs once on component mount

  // Whenever the token changes (e.g. on login), fetch the current user data to hydrate the app with user info
  useEffect(() => {
    if (token) {
      getCurrentUser();
    }
  }, [token]); // Depends on token - runs when token changes

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
        const message =
          error.response?.data?.message || // Try to get error message from backend response
          genericErrorMessage; // Fallback message if backend doesn't provide one
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
  const register = async (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post("/auth/register", {
        name,
        email,
        password,
        confirmPassword,
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
        const message =
          error.response?.data?.message || // Try to get error message from backend response
          genericErrorMessage; // Fallback message if backend doesn't provide one
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

  // GetCurrentUser: Call GET /api/auth/me with JWT to fetch current user data, hydrate on app load
  const getCurrentUser = async () => {
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
  };

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook: Allows any component to access auth state and functions
// Usage: const { user, token, login, logout } = useAuth();
// Must be used inside a component wrapped by <AuthProvider>, and the whole app is wrapped
export const useAuth = () => {
  // Retrieve the context value provided by AuthProvider
  const context = useContext(AuthContext);
  // Error handling: If used outside AuthProvider, throw helpful error
  // Prevents silent bugs from undefined context
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
