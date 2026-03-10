import { createContext, useContext } from "react";
// Create the context
export const ThemeContext = createContext(undefined);
// Custom hook to use the ThemeContext
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
