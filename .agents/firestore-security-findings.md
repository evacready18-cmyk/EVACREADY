# Firestore Security Findings

## Existing data and access
- `users/{uid}` contains private identity data: uid, email, name, phone, role, barangay, provider, timestamps, and verification status.
- The current app reads all `users` records for staff and admin management; the existing rules permit authenticated reads.
- Residents create their own `users/{uid}` record during email or Google registration.
- Admins create staff accounts through a secondary Firebase Auth instance.
- Staff update or delete resident profiles only when the resident belongs to the same barangay.

## Evacuation center model to add
- `evacuationCenters/{centerId}`: name, barangay, location, coords, capacity, availableSlots, imageUrl, createdAt, updatedAt.
- `evacuationCenters/{centerId}/checkIns/{residentUid}`: residentUid, checkedInAt.
- Admins and staff create/delete centers. Authenticated users read centers.
- A resident can check in only once per center. The client uses one Firestore transaction that creates the resident check-in and decreases `availableSlots` by exactly one.
- Rules require both writes in that transaction and prohibit changes to any other center fields during resident check-in.

## Existing risk retained for compatibility
- The `users` collection remains readable to authenticated users because staff/admin User Management currently requires it. It includes email and phone data and should be split into public/private profile collections before broad production use.

## Evacuation-center rule attack review
- Unauthenticated reads and writes are denied because every center and check-in rule requires authentication.
- A resident cannot create or delete a center because those operations require an admin or staff profile.
- A resident cannot modify center metadata: the only permitted fields during check-in are `availableSlots` and `updatedAt`.
- A resident cannot reduce availability by more than one or below zero; the rule requires exactly one fewer slot and the transaction rejects a full center.
- A resident cannot decrement a slot without creating their own check-in document in the same transaction because the center update uses `getAfter`.
- A resident cannot create a check-in without the matching slot decrement because the check-in creation verifies the center's `getAfter` available slot value.
- A resident cannot check into the same center twice because an existing check-in document blocks another create.
- Check-in data has a fixed schema and is readable only by its resident or a center manager.
