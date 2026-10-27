/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { CheckCircle2, Loader2, Stethoscope, X } from 'lucide-react';
import { AccountView } from './components/AccountView';
import { AgendaPlaceholderView } from './components/AgendaPlaceholderView';
import { AppShell } from './components/AppShell';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginScreen } from './components/LoginScreen';
import { PatientModal } from './components/PatientModal';
import { PatientsView } from './components/PatientsView';
import { subscribeToAuthChanges } from './lib/firebase';
import {
  createPatient,
  deletePatient,
  ensureUserProfile,
  subscribeToPatients,
  updatePatient,
} from './services/patientService';
import { AppTab, Patient, PatientFormInput } from './types';

function CliniZapWorkspace() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('pacientes');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [isPatientsLoading, setIsPatientsLoading] = useState(true);
  const [asyncFatalError, setAsyncFatalError] = useState<Error | null>(null);

  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Propagate fatal Firestore permission/quota listener errors to ErrorBoundary
  if (asyncFatalError) {
    throw asyncFatalError;
  }

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => {
      setToastMessage(null);
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  // 1. Track Firebase Authentication Session
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (!currentUser) {
        setPatients([]);
        setIsPatientsLoading(false);
        setActiveTab('pacientes');
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Sync Root User Profile & Subscribe to Isolated Patients Subcollection
  useEffect(() => {
    if (!isAuthReady || !user) {
      return;
    }

    let isCancelled = false;
    let unsubscribePatients: (() => void) | null = null;

    setIsPatientsLoading(true);

    const bootstrapSession = async () => {
      try {
        await ensureUserProfile(user);
        if (isCancelled) return;

        unsubscribePatients = subscribeToPatients(
          user.uid,
          (records) => {
            if (!isCancelled) {
              setPatients(records);
              setIsPatientsLoading(false);
            }
          },
          (err) => {
            if (!isCancelled) {
              setAsyncFatalError(err);
            }
          }
        );
      } catch (err) {
        if (!isCancelled && err instanceof Error) {
          setAsyncFatalError(err);
        }
      }
    };

    void bootstrapSession();

    return () => {
      isCancelled = true;
      if (unsubscribePatients) {
        unsubscribePatients();
      }
    };
  }, [isAuthReady, user]);

  const handleOpenCreateModal = () => {
    setEditingPatient(null);
    setIsPatientModalOpen(true);
  };

  const handleOpenEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    setIsPatientModalOpen(true);
  };

  const handleClosePatientModal = () => {
    setIsPatientModalOpen(false);
    setEditingPatient(null);
  };

  const handleSavePatient = async (data: PatientFormInput, editingId?: string) => {
    if (!user) return;
    if (editingId) {
      await updatePatient(user.uid, editingId, data);
      showToast('Dados do paciente atualizados.');
    } else {
      await createPatient(user, data);
      showToast('Paciente cadastrado com sucesso.');
    }
  };

  const handleConfirmDelete = async (patient: Patient) => {
    if (!user) return;
    await deletePatient(user.uid, patient.id);
    showToast('Paciente removido da lista.');
  };

  // Initial Auth Boot Screen
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3 p-6">
        <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center">
          <Stethoscope className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="w-4 h-4 text-teal-700 animate-spin" />
          <span>Iniciando CliniZap...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated View -> Login Screen
  if (!user) {
    return <LoginScreen />;
  }

  // Authenticated View -> AppShell with 3 Tabs
  return (
    <>
      <AppShell
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenNewPatient={handleOpenCreateModal}
        patientCount={patients.length}
      >
        {activeTab === 'pacientes' && (
          <PatientsView
            patients={patients}
            isLoading={isPatientsLoading}
            onOpenCreate={handleOpenCreateModal}
            onOpenEdit={handleOpenEditModal}
            onRequestDelete={(patient) => setPatientToDelete(patient)}
          />
        )}

        {activeTab === 'agenda' && (
          <AgendaPlaceholderView onNavigateToPatients={() => setActiveTab('pacientes')} />
        )}

        {activeTab === 'conta' && (
          <AccountView user={user} patientCount={patients.length} />
        )}
      </AppShell>

      <PatientModal
        isOpen={isPatientModalOpen}
        editingPatient={editingPatient}
        onClose={handleClosePatientModal}
        onSubmit={handleSavePatient}
      />

      <DeleteConfirmModal
        patient={patientToDelete}
        onCancel={() => setPatientToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-40 max-w-sm bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-xs font-medium"
        >
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="Fechar aviso"
            className="ml-1 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <CliniZapWorkspace />
    </ErrorBoundary>
  );
}
