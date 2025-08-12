import { useLanguage } from "@/components/LanguageProvider";

interface LoadingScreenProps {
  message?: string;
  showProgress?: boolean;
  branded?: boolean;
}

export function LoadingScreen({ 
  message = "Loading your dashboard...", 
  showProgress = true, 
  branded = true 
}: LoadingScreenProps) {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-6 p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-blue-200 dark:border-slate-700 max-w-md w-full mx-4">
        {branded && (
          <div className="flex items-center space-x-3">
            <div className="text-4xl">🔧</div>
            <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400">SPANNER</h2>
          </div>
        )}
        
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300 text-center">
            {message}
          </p>
          
          {showProgress && (
            <div className="w-64 bg-blue-100 dark:bg-slate-700 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          )}
          
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
            Setting up your workspace...
          </p>
        </div>
      </div>
    </div>
  );
}