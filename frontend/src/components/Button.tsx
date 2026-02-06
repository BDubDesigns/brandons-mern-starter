// Extend standard HTML props to inherit everything (onBlur, name, placeholder, etc.)
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean; // Optional loading state to disable the button and show loading text
}

export const Button = ({
  type = "submit",
  className = "",
  loading = false,
  children,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={`bg-interactive border-border text-text hover:bg-interactive-hover rounded border-2 px-4 py-2 font-semibold ${className}`}
      disabled={loading}
      type={type}
      {...props}
    >
      {loading ? "Loading..." : children}
    </button>
  );
};
