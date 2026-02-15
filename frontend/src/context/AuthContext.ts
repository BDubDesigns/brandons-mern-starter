import { createContext, useContext } from "react";

// Define the shape of our AuthContext state and functions using TypeScript interfaces
export interface ValidationError {
  type: string;
  msg: string;
  path: string;
  location: string;
}

// Define the shape of our AuthContext state and functions using TypeScript interfaces
// This ensures that any component using useAuth() knows exactly what data/functions are available
export interface AuthContextType {
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
  register: (name: string, email: string, password: string) => Promise<void>;
  // Hydrate user on app load (fetch current user from /api/auth/me)
  getCurrentUser: () => Promise<void>;
  updatePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  updateEmail: (newEmail: string, password: string) => Promise<void>;
  clearError: () => void;
}

// Create the AuthContext - this is what we'll wrap the entire app with
// undefined as initial value - AuthProvider will replace it with actual values
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

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
