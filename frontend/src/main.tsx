import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { ClerkProvider } from "@clerk/react"; // Import ClerkProvider
import { ThemeProvider } from "./context/ThemeProvider";
import "./index.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ClerkProvider>
  </React.StrictMode>,
);
