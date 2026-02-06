import { forwardRef } from "react";

// Extend standard HTML props to inherit everything (onBlur, name, placeholder, etc.)
interface FormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean; // Optional loading state to disable the button and show loading text
}

export const FormButton = forwardRef<HTMLButtonElement, FormButtonProps>(
  (
    { type = "submit", className = "", loading = false, children, ...props },
    ref,
  ) => {
    return (
      <button
        className={`bg-interactive border-border text-text hover:bg-interactive-hover rounded border-2 px-4 py-2 font-semibold ${className}`}
        ref={ref}
        disabled={loading}
        type={type}
        {...props}
      >
        {loading ? "Loading..." : children}
      </button>
    );
  },
);

FormButton.displayName = "FormButton";
