interface PageCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const PageCard = ({ title, subtitle, children }: PageCardProps) => {
  return (
    <div className="bg-surface border-border mr-auto ml-auto flex max-w-xl flex-col items-center justify-center rounded-xl border-2 p-4">
      <h1 className="text-3xl font-bold underline">{title}</h1>
      {subtitle && <h3 className="my-4 text-xl">{subtitle}</h3>}
      {children}
    </div>
  );
};
