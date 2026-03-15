interface PageCenteredProps {
  children: React.ReactNode;
}

export const PageCentered = ({ children }: PageCenteredProps) => {
  return (
    <div className="flex flex-1 items-center justify-center">{children}</div>
  );
};
