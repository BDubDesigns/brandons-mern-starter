import { ReactNode, useContext, useState, useEffect } from "react";

// Define the shape of the theme context
interface ThemeContextType {
  choice: "light" | "dark" | "os";
  actualTheme: "light" | "dark"; // What's actually applied
  cycleTheme: () => void; // Cycle through light, dark, os
}

// Helper functions
const getActualTheme = (choice: "light" | "dark" | "os"): "light" | "dark" => {
  if (choice === "light") return "light";
  if (choice === "dark") return "dark";
  // choice === "os"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [choice, setChoice] = useState<"light" | "dark" | "os">("os");
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");

  // on mount, load from localStorage
  useEffect(() => {
    const storedChoice = localStorage.getItem("themeChoice") as
      | "light"
      | "dark"
      | "os"
      | null;
    if (storedChoice) {
      setChoice(storedChoice);
      setActualTheme(getActualTheme(storedChoice));
    } else {
      setChoice("os"); // default to os for next time
      setActualTheme(getActualTheme("os"));
    }
  }, []); // empty dependency array means this runs once on mount

  // useEffect that watches choice
  useEffect(() => {
    // update localStorage
    localStorage.setItem("themeChoice", choice);
  }, [choice]);

  // useEffect that watches actualTheme and applies it to document.documentElement
  useEffect(() => {
    if (actualTheme === "dark") {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }, [actualTheme]);

  // useEffect that watches choice for os changes
  useEffect(() => {
    if (choice !== "os") {
      return; // if choice isnt os, do nothing
    }

    // listen for changes to the OS theme preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      setActualTheme(mediaQuery.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handleChange);

    // cleanup listener on unmount
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [choice]); // only re-run if choice changes

  // function to cycle theme
  const cycleTheme = () => {
    setChoice((prev) => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "os";
      return "light";
    });
  };
};
