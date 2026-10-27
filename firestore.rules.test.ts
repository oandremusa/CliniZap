import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let testEnv: RulesTestEnvironment;

const authedContext = (uid: string, emailVerified = true) =>
  testEnv.authenticatedContext(uid, {
    email: `${uid}@clinizap.test`,
    email_verified: emailVerified,
  });

describe('CliniZap Firestore Security Rules — Dirty Dozen & Happy Paths', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'clinizap-security-test',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  const seedOwnerProfile = async (uid: string) => {
    const db = authedContext(uid, true).firestore();
    await setDoc(doc(db, 'users', uid), {
      uid,
      email: `${uid}@clinizap.test`,
      displayName: 'Dra. Helena Costa',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  it('allows verified owner to create profile, create patient, list scoped patients, and update patient', async () => {
    await seedOwnerProfile('user_a');
    const db = authedContext('user_a', true).firestore();

    await assertSucceeds(
      setDoc(doc(db, 'users', 'user_a', 'patients', 'pat_1'), {
        nome: 'Carlos Eduardo Mendes',
        telefone: '(11) 98765-4321',
        userId: 'user_a',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );

    await assertSucceeds(
      getDocs(
        query(collection(db, 'users', 'user_a', 'patients'), where('userId', '==', 'user_a'))
      )
    );

    await assertSucceeds(
      updateDoc(doc(db, 'users', 'user_a', 'patients', 'pat_1'), {
        telefone: '(11) 91234-5678',
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('01. rejects unauthenticated patient creation', async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(unauthDb, 'users', 'user_a', 'patients', 'pat_1'), {
        nome: 'Maria Silva',
        telefone: '(11) 98765-4321',
        userId: 'user_a',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('02. rejects unverified email spoof attack', async () => {
    const spoofDb = authedContext('user_a', false).firestore();
    await assertFails(
      setDoc(doc(spoofDb, 'users', 'user_a'), {
        uid: 'user_a',
        email: 'user_a@clinizap.test',
        displayName: 'Spoof User',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('03. rejects cross-tenant patient read and write', async () => {
    await seedOwnerProfile('user_a');
    await seedOwnerProfile('user_b');
    const dbA = authedContext('user_a', true).firestore();
    const dbB = authedContext('user_b', true).firestore();

    await setDoc(doc(dbA, 'users', 'user_a', 'patients', 'pat_1'), {
      nome: 'Ana Paula Souza',
      telefone: '(21) 99876-5432',
      userId: 'user_a',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await assertFails(getDoc(doc(dbB, 'users', 'user_a', 'patients', 'pat_1')));
  });

  it('04. rejects identity spoofing where payload userId differs from auth uid', async () => {
    await seedOwnerProfile('user_a');
    const dbA = authedContext('user_a', true).firestore();

    await assertFails(
      setDoc(doc(dbA, 'users', 'user_a', 'patients', 'pat_spoof'), {
        nome: 'João Pedro',
        telefone: '(11) 98765-4321',
        userId: 'user_b',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('05. rejects orphaned patient write when parent user profile does not exist', async () => {
    const dbNoProfile = authedContext('user_orphan', true).firestore();
    await assertFails(
      setDoc(doc(dbNoProfile, 'users', 'user_orphan', 'patients', 'pat_1'), {
        nome: 'Paciente Órfão',
        telefone: '(11) 98765-4321',
        userId: 'user_orphan',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('06. rejects shadow field injection on patient create', async () => {
    await seedOwnerProfile('user_a');
    const dbA = authedContext('user_a', true).firestore();

    await assertFails(
      setDoc(doc(dbA, 'users', 'user_a', 'patients', 'pat_shadow'), {
        nome: 'Fernanda Lima',
        telefone: '(11) 98765-4321',
        userId: 'user_a',
        isAdmin: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('07. rejects shadow field injection on patient update', async () => {
    await seedOwnerProfile('user_a');
    const dbA = authedContext('user_a', true).firestore();

    await setDoc(doc(dbA, 'users', 'user_a', 'patients', 'pat_1'), {
      nome: 'Fernanda Lima',
      telefone: '(11) 98765-4321',
      userId: 'user_a',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await assertFails(
      updateDoc(doc(dbA, 'users', 'user_a', 'patients', 'pat_1'), {
        role: 'admin',
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('08. rejects value poisoning with oversized patient name (> 120 chars)', async () => {
    await seedOwnerProfile('user_a');
    const dbA = authedContext('user_a', true).firestore();

    await assertFails(
      setDoc(doc(dbA, 'users', 'user_a', 'patients', 'pat_huge'), {
        nome: 'A'.repeat(200),
        telefone: '(11) 98765-4321',
        userId: 'user_a',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('09. rejects invalid phone format bypassing DDD mask', async () => {
    await seedOwnerProfile('user_a');
    const dbA = authedContext('user_a', true).firestore();

    await assertFails(
      setDoc(doc(dbA, 'users', 'user_a', 'patients', 'pat_badphone'), {
        nome: 'Roberto Alves',
        telefone: '11987654321-invalid',
        userId: 'user_a',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('10. rejects forged client-side createdAt timestamp', async () => {
    await seedOwnerProfile('user_a');
    const dbA = authedContext('user_a', true).firestore();

    await assertFails(
      setDoc(doc(dbA, 'users', 'user_a', 'patients', 'pat_forged_time'), {
        nome: 'Roberto Alves',
        telefone: '(11) 98765-4321',
        userId: 'user_a',
        createdAt: Timestamp.fromMillis(946684800000),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('11. rejects mutation of immutable createdAt field during update', async () => {
    await seedOwnerProfile('user_a');
    const dbA = authedContext('user_a', true).firestore();

    await setDoc(doc(dbA, 'users', 'user_a', 'patients', 'pat_immortal'), {
      nome: 'Roberto Alves',
      telefone: '(11) 98765-4321',
      userId: 'user_a',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await assertFails(
      updateDoc(doc(dbA, 'users', 'user_a', 'patients', 'pat_immortal'), {
        createdAt: Timestamp.fromMillis(946684800000),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('12. rejects root users enumeration and unscoped patient list queries', async () => {
    await seedOwnerProfile('user_a');
    const dbA = authedContext('user_a', true).firestore();

    await assertFails(getDocs(collection(dbA, 'users')));
    await assertFails(getDocs(collection(dbA, 'users', 'user_a', 'patients')));
  });
});
