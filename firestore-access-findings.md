# Firestore Access Findings

## Instance

- Project: `evacready`
- Database: `(default)`, Standard edition, Firestore Native mode
- SDK: Modular Firebase Web SDK; Firebase Admin SDK is used by the SMS function

## Collections And Access Patterns

- `users/{uid}`: profiles contain email, phone, address, role, and barangay. Reads, profile writes, and admin/staff role operations are implemented in `src/services/firebase.js` and constrained in `firestore.rules`.
- `users/{uid}/notificationDismissals/{announcementId}`: resident-owned read/create/delete operations.
- `evacuationCenters/{centerId}`: subscription, admin/staff create/delete, and transactional capacity updates.
- `evacuationCenters/{centerId}/checkIns/{residentUid}`: resident/staff check-in get/list/create/delete and transaction reads.
- `evacuees/{residentUid}`: active check-in and check-out records, including denormalized phone and barangay fields.
- `evacueeHistory/{historyId}`: history create/read/update/delete; queries filter by `barangay` or `residentUid`.
- `announcements/{announcementId}`: staff/admin create, role/barangay-scoped read, admin delete. Queries include `createdAt` ordering, audience equality/in filters, and the `audience == barangay` plus `barangay == scope` filter.
- `teamChatMessages/{messageId}`: admin/staff create/read; ordered by `createdAt`.
- `floodProneBarangays/{barangayId}`: admin-only list/create/update/delete; admins can get any record, while a resident can get only the record whose barangay matches their own profile. Writes validate `barangay`, `updatedBy`, and server timestamp `updatedAt`.

The queries are implemented in `src/services/firebase.js`; existing read constraints are represented in `firestore.rules`. The flood-prone list uses a collection listener without filters or ordering, so it requires no composite index.

## Flood-Prone Rule Checks

- Unauthenticated get/list: denied.
- Resident get of a different barangay and resident collection list: denied.
- Non-admin write/delete: denied by `isAdmin()`.
- Create/update with extra or missing fields, invalid barangay length/type, mismatched `updatedBy`, or a non-request-time timestamp: denied by `isValidFloodProneBarangay`.
- Admin create/update/delete for the intended list: allowed.
- No fields in this collection contain resident PII.

These are source-level rule checks; the Firestore emulator is not configured in this repository, so adversarial requests were not executed against an emulator.

## Existing Rule Risk Observed

The existing `/users/{userId}` rule allows any authenticated user to read profiles containing PII. This feature does not broaden that access, and this unrelated authorization behavior was not changed; it should be reviewed separately before a broad production launch.