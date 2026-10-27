import { useState } from 'react';
import { User } from 'firebase/auth';
import { Loader2, LogOut } from 'lucide-react';
import { signOutUser } from '../lib/firebase';
import { UserAvatar } from './UserAvatar';

interface AccountViewProps {
  user: User;
  patientCount: number;
}

function formatAuthTimestamp(raw?: string): string {
  if (!raw) return 'Sessão ativa';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return 'Sessão ativa';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

export function AccountView({ user, patientCount }: AccountViewProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const displayName = user.displayName || user.email?.split('@')[0] || 'Profissional';

  const handleLogout = async () => {
    setLogoutError(null);
    setIsSigningOut(true);
    try {
      await signOutUser();
    } catch {
      setLogoutError('Não foi possível encerrar a sessão. Tente novamente.');
      setIsSigningOut(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">Conta</h1>
        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
          <span>Perfil do profissional</span>
          <span aria-hidden="true">·</span>
          <span>Autenticação Google</span>
        </div>
      </div>

      {/* Single-Elevation Account Panel */}
      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200/80">
        {/* Identity Summary */}
        <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            <UserAvatar name={displayName} photoURL={user.photoURL} size="lg" />
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold text-slate-900 truncate">
                {displayName}
              </h2>
              <p className="text-sm text-slate-600 truncate mt-0.5">{user.email}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>Conta Google {user.emailVerified ? 'verificada' : 'conectada'}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {patientCount} {patientCount === 1 ? 'paciente ativo' : 'pacientes ativos'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isSigningOut}
            className="min-h-[42px] px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-slate-700 text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer self-start sm:self-center disabled:opacity-60 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/35"
          >
            {isSigningOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Saindo...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sair da conta</span>
              </>
            )}
          </button>
        </div>

        {/* Account Details Rows */}
        <dl className="divide-y divide-slate-100 text-sm">
          <div className="px-6 py-4 sm:px-7 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
            <dt className="text-xs font-medium text-slate-500">Nome completo</dt>
            <dd className="sm:col-span-2 text-slate-900 font-medium">{displayName}</dd>
          </div>

          <div className="px-6 py-4 sm:px-7 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
            <dt className="text-xs font-medium text-slate-500">E-mail de acesso</dt>
            <dd className="sm:col-span-2 text-slate-900 break-all">{user.email || '—'}</dd>
          </div>

          <div className="px-6 py-4 sm:px-7 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
            <dt className="text-xs font-medium text-slate-500">Identificador do usuário (UID)</dt>
            <dd className="sm:col-span-2 font-mono text-xs text-slate-600 tabular-nums break-all">
              {user.uid}
            </dd>
          </div>

          <div className="px-6 py-4 sm:px-7 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
            <dt className="text-xs font-medium text-slate-500">Último acesso registrado</dt>
            <dd className="sm:col-span-2 font-mono text-xs text-slate-600 tabular-nums">
              {formatAuthTimestamp(user.metadata.lastSignInTime)}
            </dd>
          </div>

          <div className="px-6 py-4 sm:px-7 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
            <dt className="text-xs font-medium text-slate-500">Isolamento de dados</dt>
            <dd className="sm:col-span-2 text-xs text-slate-600 leading-relaxed">
              Todos os seus registros são armazenados em{' '}
              <span className="font-mono text-slate-800">/users/{user.uid}/patients</span> com
              regras de segurança restritas exclusivamente à sua conta autenticada.
            </dd>
          </div>
        </dl>

        {logoutError && (
          <div role="alert" className="px-6 py-3 bg-red-50 text-xs text-red-700">
            {logoutError}
          </div>
        )}
      </div>
    </div>
  );
}
