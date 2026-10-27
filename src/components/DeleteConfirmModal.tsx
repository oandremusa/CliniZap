import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { formatPhoneDisplay } from '../lib/validation';
import { Patient } from '../types';

interface DeleteConfirmModalProps {
  patient: Patient | null;
  onCancel: () => void;
  onConfirm: (patient: Patient) => Promise<void>;
}

export function DeleteConfirmModal({
  patient,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (patient) {
      setIsDeleting(false);
      setDeleteError(null);
    }
  }, [patient]);

  useEffect(() => {
    if (!patient) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleting) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [patient, isDeleting, onCancel]);

  if (!patient) return null;

  const handleConfirm = async () => {
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await onConfirm(patient);
      onCancel();
    } catch {
      setDeleteError('Não foi possível excluir o paciente. Tente novamente.');
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[1px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-patient-title"
        className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6"
      >
        <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-5 h-5" />
        </div>

        <h2
          id="delete-patient-title"
          className="font-display text-lg font-bold text-slate-900"
        >
          Excluir paciente
        </h2>

        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Tem certeza que deseja remover{' '}
          <span className="font-semibold text-slate-900">{patient.nome}</span> (
          <span className="font-mono tabular-nums text-slate-800">
            {formatPhoneDisplay(patient.telefone)}
          </span>
          ) da sua lista de pacientes? Esta ação não pode ser desfeita.
        </p>

        {deleteError && (
          <p role="alert" className="mt-3 text-xs text-red-600">
            {deleteError}
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="min-h-[42px] px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="min-h-[42px] px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/40"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Excluindo...</span>
              </>
            ) : (
              <span>Excluir paciente</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
