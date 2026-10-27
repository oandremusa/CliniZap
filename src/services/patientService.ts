import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import {
  USER_DISPLAY_NAME_MAX,
  USER_EMAIL_MAX,
  USER_PHOTO_URL_MAX,
  validatePatientInput,
} from '../lib/validation';
import { OperationType, Patient, PatientFormInput } from '../types';

function toDateSafe(value: unknown): Date {
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value && typeof value === 'object' && 'seconds' in value && typeof (value as { seconds: number }).seconds === 'number') {
    return new Date((value as { seconds: number }).seconds * 1000);
  }
  return new Date();
}

/**
 * Ensures the authenticated professional's root profile document exists at /users/{userId}
 * in strict compliance with firebase-blueprint.json and firestore.rules Master Gate.
 */
export async function ensureUserProfile(user: User): Promise<void> {
  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);

  const safeEmail = (user.email?.trim() || `${user.uid}@google.user`).slice(0, USER_EMAIL_MAX);
  const fallbackName = safeEmail.split('@')[0] || 'Profissional';
  const safeDisplayName = (user.displayName?.trim() || fallbackName).slice(0, USER_DISPLAY_NAME_MAX);
  const safePhotoURL =
    user.photoURL && user.photoURL.trim().length > 0
      ? user.photoURL.trim().slice(0, USER_PHOTO_URL_MAX)
      : undefined;

  let existingSnap;
  try {
    existingSnap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  if (!existingSnap.exists()) {
    try {
      await setDoc(userRef, {
        uid: user.uid,
        email: safeEmail,
        displayName: safeDisplayName,
        ...(safePhotoURL ? { photoURL: safePhotoURL } : {}),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, userPath);
    }
    return;
  }

  const currentData = existingSnap.data();
  const needsSync =
    currentData.displayName !== safeDisplayName ||
    currentData.email !== safeEmail ||
    (safePhotoURL !== undefined && currentData.photoURL !== safePhotoURL);

  if (needsSync) {
    try {
      await updateDoc(userRef, {
        displayName: safeDisplayName,
        email: safeEmail,
        ...(safePhotoURL ? { photoURL: safePhotoURL } : {}),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, userPath);
    }
  }
}

/**
 * Subscribes in real time to the authenticated user's patients at /users/{userId}/patients.
 * Scoped with where('userId', '==', userId) to satisfy zero-trust list security rules
 * and sorted chronologically by creation timestamp without composite index overhead.
 */
export function subscribeToPatients(
  userId: string,
  onPatients: (patients: Patient[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const collectionPath = `users/${userId}/patients`;
  const patientsQuery = query(
    collection(db, 'users', userId, 'patients'),
    where('userId', '==', userId)
  );

  return onSnapshot(
    patientsQuery,
    (snapshot) => {
      const records: Patient[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          nome: typeof data.nome === 'string' ? data.nome : '',
          telefone: typeof data.telefone === 'string' ? data.telefone : '',
          userId: typeof data.userId === 'string' ? data.userId : userId,
          createdAt: toDateSafe(data.createdAt),
          updatedAt: toDateSafe(data.updatedAt),
        };
      });

      records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onPatients(records);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (structuredErr) {
        if (onError && structuredErr instanceof Error) {
          onError(structuredErr);
        }
      }
    }
  );
}

/**
 * Creates a new patient document at /users/{userId}/patients/{patientId}.
 */
export async function createPatient(user: User, input: PatientFormInput): Promise<string> {
  const validation = validatePatientInput(input);
  if (!validation.valid) {
    const firstMsg = validation.errors.nome || validation.errors.telefone || 'Dados inválidos.';
    throw new Error(firstMsg);
  }

  const collectionPath = `users/${user.uid}/patients`;
  try {
    const docRef = await addDoc(collection(db, 'users', user.uid, 'patients'), {
      nome: validation.normalized.nome,
      telefone: validation.normalized.telefone,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionPath);
  }
}

/**
 * Updates an existing patient document at /users/{userId}/patients/{patientId}.
 */
export async function updatePatient(
  userId: string,
  patientId: string,
  input: PatientFormInput
): Promise<void> {
  const validation = validatePatientInput(input);
  if (!validation.valid) {
    const firstMsg = validation.errors.nome || validation.errors.telefone || 'Dados inválidos.';
    throw new Error(firstMsg);
  }

  const docPath = `users/${userId}/patients/${patientId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'patients', patientId), {
      nome: validation.normalized.nome,
      telefone: validation.normalized.telefone,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

/**
 * Deletes a patient document at /users/{userId}/patients/{patientId}.
 */
export async function deletePatient(userId: string, patientId: string): Promise<void> {
  const docPath = `users/${userId}/patients/${patientId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'patients', patientId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}
