import { useId } from "react";

// Extend standard HTML props to inherit everything (onBlur, name, placeholder, etc.)
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; // Optional label prop for accessibility
  errors?: string[] | undefined; // Array of error message strings for the input field
  containerClassName?: string; // Optional class name for styling the container div
}

// In React 19, ref is passed as a regular prop, so we can use it directly
export const FormInput = ({
  type = "text",
  className = "", // Allow passing additional class names for styling the input element
  containerClassName = "", // Allow passing class names for styling the container div
  label,
  id,
  errors,
  ...props
}: FormInputProps) => {
  const uniqueId = useId(); // Generate a unique ID for accessibility if no id prop is provided
  // We can't call useId conditionally, so we always call it and use id prop anyway, if provided. NEVER CALL HOOKS CONDITIONALLY!
  const inputId = id || uniqueId; // Use provided id or the generated unique ID
  return (
    <div className={`flex flex-col gap-0.5 ${containerClassName}`}>
      {label && <label htmlFor={inputId}>{label}</label>}
      <input
        // Associate label with input for accessibility
        id={inputId}
        type={type}
        // Base styles + incoming className override (simple string concat for now)
        className={`bg-surface-input border-border w-full rounded-lg border-2 p-2 ${className}`}
        // Spread remaining props (value, onChange, ref, etc.)
        {...props}
      />
      {errors && errors.length > 0 && (
        <ul className="text-text-error">
          {errors.map((errorMsg, index) => (
            <li key={index}>{errorMsg}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
