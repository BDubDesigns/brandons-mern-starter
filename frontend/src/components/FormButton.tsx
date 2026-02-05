import { forwardRef } from "react";

// Extend standard HTML props to inherit everything (onBlur, name, placeholder, etc.)
interface FormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const FormButton = forwardRef<HTMLButtonElement, FormButtonProps>(
  ({ type = "submit", className = "", ...props }, ref) => {
    return (
      <button
        className={`bg-interactive border-border text-text hover:bg-interactive-hover rounded border-2 px-4 py-2 font-semibold ${className}`}
        ref={ref}
        type={type}
        {...props}
      >
        {props.children}
      </button>
    );
  },
);

FormButton.displayName = "FormButton";
