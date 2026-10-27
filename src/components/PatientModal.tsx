import { FormEvent, useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import {
  maskBrazilianPhone,
  PATIENT_NAME_MAX,
  PATIENT_PHONE_MAX,
  validatePatientInput,
} from '../lib/validation';
import { Patient, PatientFormInput } from '../types';

interface PatientModalProps {
  isOpen: boolean;
  editingPatient: Patient | null;
  onClose: () => void;
  onSubmit: (data: PatientFormInput, editingId?: string) => Promise<void>;
}

export function PatientModal({
  isOpen,
  editingPatient,
  onClose,
  onSubmit,
}: PatientModalProps) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ nome?: string; telefone?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNome(editingPatient ? editingPatient.nome : '');
      setTelefone(editingPatient ? maskBrazilianPhone(editingPatient.telefone) : '');
      setFieldErrors({});
      setSubmitError(null);
      setIsSaving(false);

      const timer = window.setTimeout(() => {
        nameInputRef.current?.focus();
      }, 40);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen, editingPatient]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const handlePhoneChange = (raw: string) => {
    const formatted = maskBrazilianPhone(raw);
    setTelefone(formatted);
    if (fieldErrors.telefone) {
      setFieldErrors((prev) => ({ ...prev, telefone: undefined }));
    }
  };

  const handleNameChange = (value: string) => {
    setNome(value);
    if (fieldErrors.nome) {
      setFieldErrors((prev) => ({ ...prev, nome: undefined }));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    const validation = validatePatientInput({ nome, telefone });
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit(validation.normalized, editingPatient?.id);
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? 'Não foi possível salvar o cadastro. Verifique sua conexão e tente novamente.'
          : 'Erro ao salvar paciente.'
      );
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[1px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-modal-title"
        className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-7"
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2
              id="patient-modal-title"
              className="font-display text-lg font-bold text-slate-900"
            >
              {editingPatient ? 'Editar paciente' : 'Cadastrar paciente'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Preencha os dados de contato para sua base clínica.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Fechar janela"
            className="min-w-[40px] min-h-[40px] rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitError && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="patient-nome"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Nome completo <span className="text-red-600">*</span>
            </label>
            <input
              ref={nameInputRef}
              id="patient-nome"
              type="text"
              required
              maxLength={PATIENT_NAME_MAX}
              value={nome}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: Mariana Oliveira Santos"
              disabled={isSaving}
              aria-invalid={Boolean(fieldErrors.nome)}
              className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-colors focus:outline-none focus:ring-2 ${
                fieldErrors.nome
                  ? 'border-red-400 focus:ring-red-500/25'
                  : 'border-slate-300 focus:border-teal-600 focus:ring-teal-600/20'
              }`}
            />
            {fieldErrors.nome && (
              <p className="mt-1.5 text-xs text-red-600">{fieldErrors.nome}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="patient-telefone"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Telefone / WhatsApp com DDD <span className="text-red-600">*</span>
            </label>
            <input
              id="patient-telefone"
              type="tel"
              inputMode="numeric"
              required
              maxLength={PATIENT_PHONE_MAX}
              value={telefone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="(11) 98765-4321"
              disabled={isSaving}
              aria-invalid={Boolean(fieldErrors.telefone)}
              className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border text-sm font-mono tabular-nums text-slate-900 placeholder:text-slate-400 bg-white transition-colors focus:outline-none focus:ring-2 ${
                fieldErrors.telefone
                  ? 'border-red-400 focus:ring-red-500/25'
                  : 'border-slate-300 focus:border-teal-600 focus:ring-teal-600/20'
              }`}
            />
            {fieldErrors.telefone ? (
              <p className="mt-1.5 text-xs text-red-600">{fieldErrors.telefone}</p>
            ) : (
              <p className="mt-1.5 text-[11px] text-slate-500">
                Digite apenas números com DDD; a formatação é aplicada automaticamente.
              </p>
            )}
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="min-h-[42px] px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="min-h-[42px] px-5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>{editingPatient ? 'Salvar alterações' : 'Salvar paciente'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
