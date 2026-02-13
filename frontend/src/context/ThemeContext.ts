import { createContext, useContext } from "react";

// Define the shape of the theme context
export interface ThemeContextType {
  choice: "light" | "dark" | null;
  actualTheme: "light" | "dark"; // What's actually applied
  cycleTheme: () => void; // Cycle through light, dark, os
}

// create the context
export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);
// custom hook to use the ThemeContext
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
