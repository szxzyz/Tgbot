interface PageHeaderProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 lg:mb-8 animate-fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">{title}</h2>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base lg:text-lg">{description}</p>
      </div>
      <div className="flex items-center gap-3 w-full lg:w-auto">
        {children}
      </div>
    </div>
  );
}
