import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { FirestoreErrorInfo } from '../types';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  isQuotaError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
    isQuotaError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    let message = error.message || 'Ocorreu um erro inesperado na aplicação.';
    let isQuota = false;

    try {
      const parsed = JSON.parse(error.message) as Partial<FirestoreErrorInfo>;
      if (parsed && typeof parsed.error === 'string') {
        message = parsed.error;
      }
    } catch {
      // Plain error message
    }

    if (message.toLowerCase().includes('quota exceeded')) {
      isQuota = true;
    }

    return {
      hasError: true,
      errorMessage: message,
      isQuotaError: isQuota,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('CliniZap ErrorBoundary:', error, errorInfo);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  public render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-5">
            <AlertTriangle className="w-5 h-5" />
          </div>

          <h1 className="font-display text-xl font-semibold text-slate-900 mb-2">
            {this.state.isQuotaError
              ? 'Limite diário do banco atingido'
              : 'Não foi possível concluir a operação'}
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            {this.state.isQuotaError
              ? 'A cota gratuita diária de leituras/gravações do Firestore foi atingida e será renovada automaticamente no próximo dia.'
              : this.state.errorMessage}
          </p>

          <button
            type="button"
            onClick={this.handleReload}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Recarregar aplicação</span>
          </button>
        </div>
      </div>
    );
  }
}
