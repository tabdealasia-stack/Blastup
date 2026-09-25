import { AlertCircle, FolderOpen, Loader2 } from 'lucide-react';

export function ErrorState({ title, description, error, retry }: { title?: string; description?: string; error?: any; retry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-rose-100 rounded-xl shadow-sm min-h-[300px]">
      <div className="p-3 bg-rose-50 rounded-full mb-4">
        <AlertCircle className="w-8 h-8 text-rose-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title || 'Failed to load data'}</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
        {description || error?.message || 'An unexpected error occurred while fetching information.'}
      </p>
      {retry && (
        <button
          onClick={retry}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-rose-700 bg-rose-100 hover:bg-rose-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-gray-200 border-dashed rounded-xl min-h-[300px]">
      <div className="p-4 bg-gray-50 rounded-full mb-4">
        <FolderOpen className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
      <p className="text-sm font-medium text-gray-500">Loading...</p>
    </div>
  );
}
