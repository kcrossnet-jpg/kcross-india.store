# Security Specification — kcross india Customer Account & Orders

## 1. Data Invariants
1. **Strict Owner & Verification Gate**: Every read or write under `/users/{userId}` requires an authenticated user (`request.auth != null`) whose `request.auth.uid == userId`, and every write requires either `request.auth.token.email_verified == true` (Google / verified Email ID) or a Firebase OTP-verified `request.auth.token.phone_number` string.
2. **PII Isolation (Split Collection)**: Customer email, mobile number, default shipping address, city, PIN code, and wishlist live strictly in `/users/{userId}/private/profile`, separated from `/users/{userId}` identity metadata.
3. **Immutable Parent & Creation Fields**: `uid` and `createdAt` cannot be modified after creation (`incoming().uid == existing().uid` and `incoming().createdAt == existing().createdAt`). Temporal fields (`createdAt`, `updatedAt`) must equal `request.time`.
4. **Master Gate Relational Check**: Subcollections `/users/{userId}/private/{docId}`, `/users/{userId}/orders/{orderId}`, and `/users/{userId}/bookings/{bookingId}` verify the parent `/users/{userId}` document exists (`exists(...)`) and has matching `uid`.
5. **Terminal State & Integrity on Orders/Bookings**: Customer orders are created strictly with `status == 'Confirmed'` and cannot be arbitrarily escalated by the client; bookings are created strictly with `status == 'Confirmed'`.

## 2. The "Dirty Dozen" Attack Payloads (All Must Fail with PERMISSION_DENIED)
1. **Unauthenticated read of another user's private profile** (`/users/u1/private/profile`, `auth = null`) -> DENIED.
2. **Cross-user read** (`/users/u1/orders/ord1` read by `u2`) -> DENIED.
3. **Unverified email write** (`email_verified: false` creating `/users/u1`) -> DENIED.
4. **UID Spoofing on create** (`u1` creating `/users/u1/orders/ord1` with `uid: "u2"`) -> DENIED.
5. **Shadow / Ghost Field injection** (`isAdmin: true` or `role: "admin"` added to `/users/u1`) -> DENIED by `keys().hasOnly(...)`.
6. **Privilege Escalation on private profile update** (`uid` changed in `/users/u1/private/profile`) -> DENIED by `affectedKeys().hasOnly(...)` and immutability check.
7. **Timestamp Forgery** (`createdAt` set to past client ISO timestamp instead of `request.time`) -> DENIED.
8. **ID Poisoning** (200-char or slash/dot-containing document ID in `/users/{userId}/orders/{orderId}`) -> DENIED by `isValidId()`.
9. **Resource Exhaustion ("Denial of Wallet")** (500KB `defaultAddress` string on `/users/u1/private/profile`) -> DENIED by `.size() <= 300`.
10. **Array Poisoning on `wishlistIds`** (list of 100 items or non-string element `[123]`) -> DENIED by `.size() <= 50` and first-element string guard.
11. **Order Status Shortcutting on Create** (creating order with `status: "Delivered"` or negative `total: -500`) -> DENIED.
12. **Orphaned Subcollection Write** (creating `/users/u1/orders/ord1` when parent `/users/u1` does not exist) -> DENIED by `exists(/databases/$(database)/documents/users/$(userId))`.
