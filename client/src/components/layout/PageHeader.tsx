export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-5 border-b border-gray-200/60">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-gray-500 max-w-2xl">{description}</p>}
      </div>
      {action && <div className="mt-4 sm:mt-0 flex-shrink-0 flex items-center space-x-3">{action}</div>}
    </div>
  );
}
