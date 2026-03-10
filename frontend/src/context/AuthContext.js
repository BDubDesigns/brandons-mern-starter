import { createContext, useContext } from "react";
// Create the AuthContext - this is what we'll wrap the entire app with
// undefined as initial value - AuthProvider will replace it with actual values
export const AuthContext = createContext(undefined);
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
