export const Divider = ({ className = "" }: { className?: string }) => {
  return (
    <hr
      className={`border-border mx-auto w-1/2 rounded-full border-2 ${className}`}
    />
  );
};
