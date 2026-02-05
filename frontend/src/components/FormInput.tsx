import { forwardRef, useId } from "react";

// Extend standard HTML props to inherit everything (onBlur, name, placeholder, etc.)
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; // Optional label prop for accessibility
}

// forwardRef allows parent components to access the DOM node (for focus or validation etc.)
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ type = "text", className = "", label, id, ...props }, ref) => {
    const uniqueId = useId(); // Generate a unique ID for accessibility if no id prop is provided
    // We can't call useId conditionally, so we always call it and use id prop anyway, if provided. NEVER CALL HOOKS CONDITIONALLY!
    const inputId = id || uniqueId; // Use provided id or the generated unique ID
    return (
      <div className="flex flex-col gap-1">
        {label && <label htmlFor={inputId}>{label}</label>}
        <input
          // Connect the ref from the parent to this specific element
          ref={ref}
          // Associate label with input for accessibility
          id={inputId}
          type={type}
          // Base styles + incoming className override (simple string concat for now)
          className={`bg-surface-input border-border w-full rounded-sm border-2 p-2 ${className}`}
          // Spread remaining props (value, onChange, etc.)
          {...props}
        />
      </div>
    );
  },
);

// Required for React DevTools to show the component name instead of "ForwardRef"
FormInput.displayName = "FormInput";
