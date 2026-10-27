import { PatientFormInput } from '../types';

// Exact schema boundaries synchronized verbatim with firebase-blueprint.json & firestore.rules
export const PATIENT_NAME_MIN = 2;
export const PATIENT_NAME_MAX = 120;
export const PATIENT_PHONE_MIN = 14;
export const PATIENT_PHONE_MAX = 15;
export const PATIENT_PHONE_REGEX = /^\([0-9]{2}\) [0-9]{4,5}-[0-9]{4}$/;

export const USER_DISPLAY_NAME_MAX = 120;
export const USER_EMAIL_MAX = 254;
export const USER_PHOTO_URL_MAX = 1024;

/**
 * Applies a Brazilian phone/WhatsApp mask: (DD) XXXXX-XXXX or (DD) XXXX-XXXX.
 * Gracefully strips a leading 55 country code when pasting 12 or 13 digits.
 */
export function maskBrazilianPhone(rawValue: string): string {
  let digits = rawValue.replace(/\D/g, '');

  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    digits = digits.slice(2);
  }

  digits = digits.slice(0, 11);

  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Formats stored phone strings consistently for UI rendering.
 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';
  if (PATIENT_PHONE_REGEX.test(phone)) return phone;
  const masked = maskBrazilianPhone(phone);
  return masked || phone;
}

export interface PatientValidationResult {
  valid: boolean;
  errors: {
    nome?: string;
    telefone?: string;
  };
  normalized: PatientFormInput;
}

/**
 * Validates and normalizes outgoing Patient mutations against firebase-blueprint.json constraints.
 */
export function validatePatientInput(input: PatientFormInput): PatientValidationResult {
  const normalizedNome = input.nome.replace(/\s+/g, ' ').trim().slice(0, PATIENT_NAME_MAX);
  const normalizedTelefone = maskBrazilianPhone(input.telefone);
  const errors: { nome?: string; telefone?: string } = {};

  if (!normalizedNome) {
    errors.nome = 'Informe o nome completo do paciente.';
  } else if (normalizedNome.length < PATIENT_NAME_MIN) {
    errors.nome = `O nome deve ter pelo menos ${PATIENT_NAME_MIN} caracteres.`;
  } else if (normalizedNome.length > PATIENT_NAME_MAX) {
    errors.nome = `O nome deve ter no máximo ${PATIENT_NAME_MAX} caracteres.`;
  }

  const digits = normalizedTelefone.replace(/\D/g, '');
  const ddd = digits.length >= 2 ? Number(digits.slice(0, 2)) : 0;

  if (!normalizedTelefone) {
    errors.telefone = 'Informe o telefone ou WhatsApp com DDD.';
  } else if (digits.length < 10 || digits.length > 11) {
    errors.telefone = 'Digite o DDD + número com 10 ou 11 dígitos. Ex: (11) 98765-4321.';
  } else if (ddd < 11 || ddd > 99) {
    errors.telefone = 'Informe um DDD brasileiro válido (ex: 11, 21, 31).';
  } else if (
    normalizedTelefone.length < PATIENT_PHONE_MIN ||
    normalizedTelefone.length > PATIENT_PHONE_MAX ||
    !PATIENT_PHONE_REGEX.test(normalizedTelefone)
  ) {
    errors.telefone = 'Formato inválido. Use (DD) 9XXXX-XXXX.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    normalized: {
      nome: normalizedNome,
      telefone: normalizedTelefone,
    },
  };
}
