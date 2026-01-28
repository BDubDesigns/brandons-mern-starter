import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

// Define the shape of the theme context
interface ThemeContextType {
  choice: "light" | "dark" | null;
  actualTheme: "light" | "dark"; // What's actually applied
  cycleTheme: () => void; // Cycle through light, dark, os
}

// Helper functions
const getActualTheme = (choice: "light" | "dark" | null): "light" | "dark" => {
  if (choice === "light") return "light";
  if (choice === "dark") return "dark";
  // choice === null means follow OS preference
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

// create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [choice, setChoice] = useState<"light" | "dark" | null>(null);
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");

  // on mount, load from localStorage
  useEffect(() => {
    // load saved choice from localStorage
    const stored = localStorage.getItem("themeChoice");
    // validate stored value - if not valid, ignore it
    const storedChoice =
      stored === "light" || stored === "dark" ? stored : null;

    setChoice(storedChoice);
    setActualTheme(getActualTheme(storedChoice));
  }, []); // empty dependency array means this runs once on mount

  // useEffect that watches choice
  useEffect(() => {
    if (choice === null) {
      // Compute actualTheme from OS + set up listener
      setActualTheme(getActualTheme(null));
      // delete saved choice from localStorage
      localStorage.removeItem("themeChoice");

      // set up listener for OS changes
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        setActualTheme(mediaQuery.matches ? "dark" : "light");
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      // choice is "light" or "dark" - set directly
      setActualTheme(choice);
    }
  }, [choice]);

  // useEffect that watches actualTheme and applies it to document.documentElement
  useEffect(() => {
    if (actualTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [actualTheme]);

  // function to cycle theme
  const cycleTheme = () => {
    setChoice((prev) => {
      if (prev === "light") return "dark";
      if (prev === "dark") return null;
      return "light";
    });
  };
  return (
    <ThemeContext.Provider value={{ choice, actualTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// custom hook to use the ThemeContext
const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export { ThemeContext, useTheme };
