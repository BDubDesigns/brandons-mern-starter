import { ReactNode, useState, useEffect } from "react";
import { ThemeContext } from "./ThemeContext";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [choice, setChoice] = useState<"light" | "dark" | null>(() => {
    const stored = localStorage.getItem("themeChoice");
    return stored === "light" || stored === "dark" ? stored : null;
  });

  // os preference state
  const [osPreference, setOsPreference] = useState<"light" | "dark">(() => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  const actualTheme = choice === null ? osPreference : choice;

  // sync choice to localstorage
  useEffect(() => {
    if (choice === null) {
      localStorage.removeItem("themeChoice");
    } else {
      localStorage.setItem("themeChoice", choice);
    }
  }, [choice]); // we only want to update localStorage when the user explicitly changes their choice, not on every render

  // media query listener for os preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      setOsPreference(mediaQuery.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []); // empty dependency array because we only want to set up the listener once on mount

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
  // Provide to consumers

  // Note: We create a new value object on each render, but since theme
  // changes rarely, the performance impact is negligible. If we saw
  // unnecessary re-renders in DevTools, we'd wrap this in useMemo().
  return (
    <ThemeContext.Provider value={{ choice, actualTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
