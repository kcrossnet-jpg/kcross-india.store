import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error?.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(readable) as { error?: string; operationType?: string; path?: string };
      if (parsed && typeof parsed === 'object' && parsed.error) {
        if (parsed.error.includes('Missing or insufficient permissions')) {
          readable = 'You do not have permission to access that customer record. Please sign in again.';
        } else if (parsed.error.includes('Quota exceeded')) {
          readable = 'Daily Firestore database quota reached. Please try again tomorrow.';
        } else {
          readable = parsed.error;
        }
      }
    } catch {
      // Plain error message
    }
    return { hasError: true, message: readable };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Storefront ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-[#FCF9F5] text-[#1C1613] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-[#EAE1D8] bg-white p-7 sm:p-8 shadow-sm space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
            kcross india store
          </p>
          <h1 className="font-display text-2xl font-bold text-[#1C1613]">
            Something interrupted your session
          </h1>
          <p className="text-sm text-[#574B44] leading-relaxed">{this.state.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full rounded-lg bg-[#C2410C] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#9A3412]"
          >
            Reload Storefront
          </button>
        </div>
      </div>
    );
  }
}
