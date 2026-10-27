import { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { formatPhoneDisplay } from '../lib/validation';
import { Patient } from '../types';

type SortOrder = 'recent' | 'oldest' | 'alpha';

interface PatientsViewProps {
  patients: Patient[];
  isLoading: boolean;
  onOpenCreate: () => void;
  onOpenEdit: (patient: Patient) => void;
  onRequestDelete: (patient: Patient) => void;
}

function formatCreatedDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}

function getPatientInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'P';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function PatientsView({
  patients,
  isLoading,
  onOpenCreate,
  onOpenEdit,
  onRequestDelete,
}: PatientsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredPatients = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const digitsQuery = searchQuery.replace(/\D/g, '');

    const list = patients.filter((patient) => {
      if (!normalizedQuery) return true;
      const matchesName = patient.nome.toLowerCase().includes(normalizedQuery);
      const matchesPhone =
        digitsQuery.length > 0 &&
        patient.telefone.replace(/\D/g, '').includes(digitsQuery);
      return matchesName || matchesPhone;
    });

    const sorted = [...list];
    if (sortOrder === 'recent') {
      sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (sortOrder === 'oldest') {
      sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    } else {
      sorted.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    }

    return sorted;
  }, [patients, searchQuery, sortOrder]);

  const handleCopyPhone = async (patient: Patient) => {
    try {
      await navigator.clipboard.writeText(formatPhoneDisplay(patient.telefone));
      setCopiedId(patient.id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === patient.id ? null : current));
      }, 1800);
    } catch {
      // Clipboard API unavailable in restricted context
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Heading + Mobile Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Pacientes
          </h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <span>Base clínica isolada</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {isLoading
                ? 'Carregando registros...'
                : `${patients.length} ${
                    patients.length === 1 ? 'paciente cadastrado' : 'pacientes cadastrados'
                  }`}
            </span>
          </div>
        </div>

        {/* Mobile CTA (Desktop CTA already lives in Top Bar Contract) */}
        <button
          type="button"
          onClick={onOpenCreate}
          className="sm:hidden min-h-[44px] px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Novo paciente</span>
        </button>
      </div>

      {/* Search & Ordering Toolbar (rendered when loading completes and has patients or active search) */}
      {(!isLoading && patients.length > 0) || searchQuery.trim().length > 0 ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar paciente por nome..."
              aria-label="Buscar paciente por nome"
              className="w-full min-h-[42px] pl-10 pr-9 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Limpar busca"
                className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Interactive Sort Segmented Controls */}
          <div
            role="group"
            aria-label="Ordenar lista de pacientes"
            className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto"
          >
            <button
              type="button"
              onClick={() => setSortOrder('recent')}
              className={`min-h-[32px] px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 ${
                sortOrder === 'recent'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mais recentes
            </button>
            <button
              type="button"
              onClick={() => setSortOrder('alpha')}
              className={`min-h-[32px] px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 ${
                sortOrder === 'alpha'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nome A–Z
            </button>
            <button
              type="button"
              onClick={() => setSortOrder('oldest')}
              className={`min-h-[32px] px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 ${
                sortOrder === 'oldest'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mais antigos
            </button>
          </div>
        </div>
      ) : null}

      {/* State 1: Loading Skeleton */}
      {isLoading ? (
        <div
          aria-busy="true"
          aria-label="Carregando pacientes"
          className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden"
        >
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="h-14 px-5 flex items-center justify-between gap-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0" />
                <div className="h-3.5 w-44 bg-slate-100 rounded" />
              </div>
              <div className="flex items-center gap-6">
                <div className="h-3.5 w-28 bg-slate-100 rounded hidden sm:block" />
                <div className="h-3.5 w-20 bg-slate-100 rounded hidden md:block" />
                <div className="h-7 w-14 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : patients.length === 0 ? (
        /* State 2: Friendly Empty State (0 patients registered) */
        <div className="bg-white border border-slate-200 rounded-xl px-6 py-14 text-center">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-6 h-6" />
          </div>
          <p className="text-sm sm:text-base font-medium text-slate-800 max-w-md mx-auto">
            Nenhum paciente cadastrado ainda. Adicione o seu primeiro paciente.
          </p>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Seus pacientes ficarão disponíveis aqui com telefone padronizado para facilitar o
            atendimento.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={onOpenCreate}
              className="min-h-[44px] px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Adicionar primeiro paciente</span>
            </button>
          </div>
        </div>
      ) : filteredPatients.length === 0 ? (
        /* State 3: Empty Search Filter Result */
        <div className="bg-white border border-slate-200 rounded-xl px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-800">
            Nenhum paciente encontrado para &ldquo;{searchQuery.trim()}&rdquo;.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Verifique a grafia do nome ou limpe o filtro de busca.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="min-h-[40px] px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
            >
              Limpar busca
            </button>
          </div>
        </div>
      ) : (
        /* State 4: Populated High-Density Clinical List / Table */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Desktop Table Header */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-5 py-3 bg-slate-50/80 border-b border-slate-200 text-xs font-medium text-slate-500">
            <div className="col-span-5">Paciente</div>
            <div className="col-span-4">Telefone / WhatsApp</div>
            <div className="col-span-2 text-right">Cadastro</div>
            <div className="col-span-1 text-right">Ações</div>
          </div>

          <ul className="divide-y divide-slate-200/80">
            {filteredPatients.map((patient) => {
              const formattedPhone = formatPhoneDisplay(patient.telefone);
              const isCopied = copiedId === patient.id;

              return (
                <li
                  key={patient.id}
                  className="px-4 py-3.5 sm:px-5 md:py-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex flex-col gap-3 md:grid md:grid-cols-12 md:items-center md:gap-4">
                    {/* Name Column */}
                    <div className="md:col-span-5 flex items-center gap-3 min-w-0">
                      <div
                        aria-hidden="true"
                        className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center shrink-0 select-none"
                      >
                        {getPatientInitials(patient.nome)}
                      </div>
                      <span className="text-sm font-medium text-slate-900 truncate">
                        {patient.nome}
                      </span>
                    </div>

                    {/* Phone Column */}
                    <div className="md:col-span-4 flex items-center gap-2 pl-11 md:pl-0">
                      <span className="text-sm font-mono tabular-nums text-slate-700">
                        {formattedPhone}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyPhone(patient)}
                        aria-label={`Copiar telefone de ${patient.nome}`}
                        title="Copiar número"
                        className="min-w-[32px] min-h-[32px] px-1.5 rounded-md text-slate-400 hover:text-teal-700 hover:bg-teal-50/70 inline-flex items-center gap-1 text-[11px] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                            <span className="text-teal-700 font-sans">Copiado</span>
                          </>
                        ) : (
                          <Copy className="w-3.5 h-3.5 shrink-0" />
                        )}
                      </button>
                    </div>

                    {/* Registration Date Column */}
                    <div className="hidden md:block md:col-span-2 text-right text-xs text-slate-500 font-mono tabular-nums">
                      {formatCreatedDate(patient.createdAt)}
                    </div>

                    {/* Actions Column */}
                    <div className="md:col-span-1 flex items-center justify-between md:justify-end gap-1 pl-11 md:pl-0">
                      <span className="md:hidden text-xs text-slate-400 font-mono tabular-nums">
                        {formatCreatedDate(patient.createdAt)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenEdit(patient)}
                          aria-label={`Editar paciente ${patient.nome}`}
                          title="Editar paciente"
                          className="min-w-[40px] min-h-[40px] md:min-w-[36px] md:min-h-[36px] rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDelete(patient)}
                          aria-label={`Excluir paciente ${patient.nome}`}
                          title="Excluir paciente"
                          className="min-w-[40px] min-h-[40px] md:min-w-[36px] md:min-h-[36px] rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
