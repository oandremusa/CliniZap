import { useState } from 'react';
import { AlertCircle, Loader2, Stethoscope } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

function GoogleMark() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.275c0-.85-.075-1.675-.215-2.475H12v4.69h6.45c-.28 1.5-1.125 2.775-2.395 3.63v3.015h3.875c2.265-2.085 3.56-5.16 3.56-8.86Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.955-1.075 7.94-2.91l-3.875-3.015c-1.075.72-2.45 1.15-4.065 1.15-3.125 0-5.77-2.11-6.715-4.945H1.28v3.11C3.255 21.31 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.285 14.28A7.22 7.22 0 0 1 4.91 12c0-.795.135-1.565.375-2.28V6.61H1.28A11.995 11.995 0 0 0 0 12c0 1.935.465 3.765 1.28 5.39l4.005-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.775c1.76 0 3.34.605 4.585 1.795l3.435-3.435C17.95 1.19 15.235 0 12 0 7.31 0 3.255 2.69 1.28 6.61l4.005 3.11c.945-2.835 3.59-4.945 6.715-4.945Z"
      />
    </svg>
  );
}

function mapAuthErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Não foi possível autenticar no momento. Tente novamente.';
  }
  const code = (error as { code?: string }).code ?? '';
  if (code === 'auth/popup-closed-by-user') {
    return 'A janela de login foi fechada antes da conclusão. Clique novamente para entrar.';
  }
  if (code === 'auth/popup-blocked') {
    return 'O navegador bloqueou a janela de autenticação. Permita pop-ups para continuar.';
  }
  if (code === 'auth/cancelled-popup-request') {
    return 'Solicitação anterior cancelada. Tente novamente.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Falha de conexão com a rede. Verifique sua internet e tente novamente.';
  }
  return 'Não foi possível entrar com o Google. Tente novamente em instantes.';
}

export function LoginScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(mapAuthErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      {/* Main Architectural Split */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Clinical Brand & Positioning */}
          <section className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <span className="font-display text-2xl font-bold tracking-tight text-slate-900">
                CliniZap
              </span>
            </div>

            <div className="space-y-4 max-w-xl">
              <h1
                className="font-display text-3xl sm:text-4xl lg:text-[2.65rem] font-bold tracking-tight text-slate-900 leading-[1.15]"
                style={{ textWrap: 'balance' }}
              >
                Sua agenda e atendimento automatizados com IA
              </h1>
              <p className="text-base text-slate-600 leading-relaxed">
                Gestão clínica enxuta para médicos, dentistas, psicólogos e consultórios.
                Organize sua base de pacientes com isolamento total de dados e prepare sua recepção
                para confirmações inteligentes.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-200/90 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-medium text-teal-800 mb-1">01. Base de Pacientes</p>
                <p className="text-sm text-slate-600 leading-snug">
                  Cadastro rápido com nome completo e WhatsApp padronizado com DDD.
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-teal-800 mb-1">02. Agenda Inteligente</p>
                <p className="text-sm text-slate-600 leading-snug">
                  Estrutura pronta para evolução de horários e controle de consultas.
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-teal-800 mb-1">03. Isolamento Seguro</p>
                <p className="text-sm text-slate-600 leading-snug">
                  Dados privados por profissional vinculados à sua conta Google.
                </p>
              </div>
            </div>
          </section>

          {/* Right Column: Clean Clinical Authentication Card */}
          <section className="lg:col-span-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-7 sm:p-9">
              <div className="mb-7">
                <p className="text-xs font-medium text-teal-700 mb-1.5">Acesso do Profissional</p>
                <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
                  Entrar no CliniZap
                </h2>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                  Utilize sua conta Google profissional para acessar seus pacientes e sua agenda.
                </p>
              </div>

              {authError && (
                <div
                  role="alert"
                  className="mb-5 p-3.5 rounded-lg bg-red-50/80 border border-red-200 text-red-800 text-xs leading-relaxed flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 text-slate-800 font-medium text-sm flex items-center justify-center gap-3 transition-colors duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 text-teal-700 animate-spin shrink-0" />
                    <span>Conectando ao Google...</span>
                  </>
                ) : (
                  <>
                    <GoogleMark />
                    <span>Continuar com o Google</span>
                  </>
                )}
              </button>

              <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
                Acesso protegido via Firebase Authentication. Seus registros clínicos permanecem
                restritos exclusivamente ao seu perfil autenticado.
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Discreet Footer */}
      <footer className="py-5 px-6 border-t border-slate-200/70 text-center">
        <p className="text-xs text-slate-500 tabular-nums">© 2026 CliniZap</p>
      </footer>
    </div>
  );
}
