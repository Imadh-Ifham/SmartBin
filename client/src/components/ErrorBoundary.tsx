import React from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary - Catches React component errors and displays graceful UI
 * Provides recovery options (retry, home, report)
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState(prevState => ({
      ...prevState,
      errorInfo
    }));

    // Log to console in development
    console.error('Error Boundary caught:', error, errorInfo);

    // Optional callback for error tracking services (e.g., Sentry)
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.resetError}
          fallback={this.props.fallback}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Error Fallback UI - Professional error display with recovery options
 */
function ErrorFallback({
  error,
  errorInfo,
  onReset,
  fallback
}: {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  onReset: () => void;
  fallback?: ReactNode;
}) {
  const navigate = useNavigate();

  if (fallback) return <>{fallback}</>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Error Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Icon & Title */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Oops! Something went wrong</h1>
            <p className="text-slate-600">We encountered an error while loading this page.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-red-900">Error Details:</p>
              <p className="text-sm text-red-700 font-mono break-all">
                {error.message || 'Unknown error'}
              </p>
            </div>
          )}

          {/* Stack Trace (Development Only) */}
          {typeof import.meta.env.VITE_ENV !== 'undefined' && import.meta.env.VITE_ENV === 'development' && errorInfo && (
            <details className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg cursor-pointer">
              <summary className="font-semibold mb-2">Stack Trace (Dev Only)</summary>
              <pre className="overflow-auto max-h-32 whitespace-pre-wrap font-mono">
                {errorInfo.componentStack}
              </pre>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onReset}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
            >
              <Home className="w-4 h-4" />
              Go Home
            </button>
          </div>

          {/* Report Link */}
          <div className="pt-4 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-600">
              If this keeps happening, please{' '}
              <a
                href="mailto:support@smartbin.local"
                className="text-blue-600 hover:underline font-medium"
              >
                contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;
