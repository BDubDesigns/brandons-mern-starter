# Theme Toggle Implementation for MERN + Vite + Tailwind v4

## Step 1: Configure Tailwind CSS for class-based dark mode

In your `app.css` (or main CSS file where you import Tailwind):

```css
@import "tailwindcss";

@theme {
  /* Your custom theme variables if needed */
}

/* Enable class-based dark mode */
@variant dark (&:is(.dark *));
```

## Step 2: Create ThemeContext

Create `src/context/ThemeContext.jsx`:

```javascript
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

## Step 3: Wrap your app with ThemeProvider

In `src/App.jsx`:

```javascript
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  return <ThemeProvider>{/* Your app components */}</ThemeProvider>;
}

export default App;
```

## Step 4: Use the theme in components

```javascript
import { useTheme } from "./context/ThemeContext";

function MyComponent() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="bg-white dark:bg-gray-900 text-black dark:text-white">
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800"
      >
        {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
      </button>
    </div>
  );
}
```

## How it works

1. The `@variant dark` CSS directive enables class-based dark mode in Tailwind v4
2. ThemeContext manages theme state and persists it to localStorage
3. On mount, it checks localStorage first, then falls back to system preference
4. When theme changes, it toggles the `dark` class on `<html>`
5. Use Tailwind's `dark:` variant prefix for dark mode styles
