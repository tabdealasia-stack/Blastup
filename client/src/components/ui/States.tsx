import { FolderX, AlertCircle } from 'lucide-react';

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-gray-200 border-dashed rounded-lg">
      <FolderX className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description, retry }: { title?: string; description?: string; retry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-red-50 border border-red-100 rounded-lg">
      <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-red-800">{title}</h3>
      {description && <p className="mt-2 text-sm text-red-600 max-w-sm mx-auto">{description}</p>}
      {retry && (
        <button onClick={retry} className="mt-6 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none">
          Try again
        </button>
      )}
    </div>
  );
}
