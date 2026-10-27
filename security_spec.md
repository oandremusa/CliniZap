# CliniZap — Firestore Security Specification (Phase 0 & Red Team Audit)

## 1. Data Invariants

1. **Zero Unauthenticated Access**: No document in any collection or subcollection may be read, listed, created, updated, or deleted without an authenticated Firebase session (`request.auth != null`) and a verified Google email (`request.auth.token.email_verified == true`).
2. **Strict Tenant & PII Isolation**: A professional (`userId`) can only access `/users/{userId}` and `/users/{userId}/patients/{patientId}` where `request.auth.uid == userId`. Listing `/users` is unconditionally forbidden (`allow list: if false`).
3. **Master Gate Relational Integrity**: Every patient document under `/users/{userId}/patients/{patientId}` requires the parent `/users/{userId}` profile document to exist (`existsAfter` / `getAfter` on create, `get` on single-doc read/update/delete) with `data.uid == request.auth.uid`.
4. **Query Enforcer on List**: `allow list` on `/users/{userId}/patients/{patientId}` enforces `request.auth.uid == userId && resource.data.userId == request.auth.uid` without `get()`/`exists()` calls, preventing cross-tenant scraping and O(n) read amplification.
5. **Strict Schema, Volumetric & Regex Boundaries**:
   - Document IDs (`userId`, `patientId`) must match `^[a-zA-Z0-9_\-]+$` and length `<= 128`.
   - `Patient.nome`: string, `2 <= size <= 120`.
   - `Patient.telefone`: string, `14 <= size <= 15`, matching `^\([0-9]{2}\) [0-9]{4,5}-[0-9]{4}$`.
   - `Patient.userId`: string, matches `request.auth.uid` and path `userId`, immutable on update.
6. **Temporal & Field Immutability**: `createdAt` and `updatedAt` must equal `request.time` on creation; `createdAt`, `uid`, and `userId` are immutable on update, while `updatedAt` must equal `request.time`. Shadow/ghost fields are blocked via `hasOnly()` and `affectedKeys().hasOnly()`.

---

## 2. The "Dirty Dozen" Adversarial Payloads

All 12 payloads below are verified in `firestore.rules.test.ts` to return `PERMISSION_DENIED`:

1. **Payload 01 — Unauthenticated Patient Create**: `auth = null` attempting `setDoc` on `/users/user_a/patients/pat_1`.
2. **Payload 02 — Unverified Email Spoof Attack**: `auth = { uid: 'user_a', email_verified: false }` attempting to create profile or patient.
3. **Payload 03 — Cross-Tenant Patient Read/Write**: `user_b` attempting `getDoc` or `setDoc` on `/users/user_a/patients/pat_1`.
4. **Payload 04 — Identity Spoofing (`userId` Mismatch)**: `user_a` writing to `/users/user_a/patients/pat_1` with `{ userId: 'user_b', ... }`.
5. **Payload 05 — Orphaned Subcollection Write (Missing Master Gate Parent)**: `user_a` creating `/users/user_a/patients/pat_1` when `/users/user_a` does not exist.
6. **Payload 06 — Shadow / Ghost Field Injection on Create**: Injecting `{ ..., isAdmin: true }` into `/users/user_a/patients/pat_1`.
7. **Payload 07 — Shadow Update / Unapproved Field Mutation**: Updating `/users/user_a/patients/pat_1` with `{ ..., role: 'superadmin' }`.
8. **Payload 08 — Value Poisoning (Oversized `nome` > 120 chars)**: Sending a 500-character string in `nome`.
9. **Payload 09 — Phone Format / Regex Bypass**: Sending `telefone: "11999999999"` or `"<script>alert(1)</script>"` instead of `(DD) XXXXX-XXXX`.
10. **Payload 10 — Temporal Forgery (Client-Backdated `createdAt`)**: Sending `createdAt: Timestamp.fromMillis(946684800000)` instead of `serverTimestamp()`.
11. **Payload 11 — Immortal Field Mutation (`createdAt` or `userId` Tampering on Update)**: Attempting to mutate `createdAt` during an update to an existing patient.
12. **Payload 12 — Unscoped List / Root Users Enumeration**: Attempting `getDocs(collection(db, 'users'))` or `getDocs(collection(db, 'users/user_a/patients'))` without `where('userId', '==', 'user_a')`.

---

## 3. Red Team Conflict Report (Phase 5 Audit)

### Collection: `/users/{userId}`
- **Identity Spoofing**: PASS — `request.auth.uid == userId && incoming().uid == request.auth.uid` on create; `incoming().uid == existing().uid` on update.
- **Shadow Update Test**: PASS — `isValidUserProfile(incoming())` enforces `hasOnly(['uid', 'email', 'displayName', 'photoURL', 'createdAt', 'updatedAt'])` and update enforces `affectedKeys().hasOnly(['displayName', 'email', 'photoURL', 'updatedAt'])`.
- **Email Spoofing Test**: PASS — `isVerified()` strictly checks `request.auth.token.email_verified == true`.
- **PII Blanket Test**: PASS — `allow get` requires `request.auth.uid == userId`; `allow list` is `false`.
- **Value Poisoning**: PASS — `isValidUserProfile(incoming())` wraps the entire `allow update` block and enforces string types and `.size()` caps on every field.

### Collection: `/users/{userId}/patients/{patientId}`
- **Identity Spoofing**: PASS — `request.auth.uid == userId && incoming().userId == userId` on create; `incoming().userId == existing().userId` on update.
- **State / Relational Shortcutting**: PASS — Master Gate checks `existsAfter` + `getAfter` on create and `get` on single-doc read/update/delete against `/users/{userId}`.
- **Resource / ID Poisoning**: PASS — `isValidId(userId)` and `isValidId(patientId)` enforce `<= 128` chars and `^[a-zA-Z0-9_\-]+$`.
- **Query Trust Test**: PASS — `allow list` enforces `request.auth.uid == userId && existing().userId == request.auth.uid` with zero `get()` calls.
- **Value Poisoning**: PASS — `isValidPatient(incoming())` is the outermost gate of `allow update`, validating `nome` length (`2..120`) and `telefone` regex (`^\([0-9]{2}\) [0-9]{4,5}-[0-9]{4}$`).
