# Firebase Security Specifications & Hardening Spec

## 1. Data Invariants
- **Identity Isolation**: A user can only access, create, or update documents under `/users/{userId}` where `{userId} == request.auth.uid`.
- **RBAC Self-Assignment Lock**: Users cannot assign themselves `role = 'admin'`. Only bootstrapped admin `aki.sokpah.link@gmail.com` or existing admins can hold admin status.
- **Subcollection Ownership**: Chat messages stored at `/users/{userId}/messages/{messageId}` require `userId == request.auth.uid`.
- **Temporal & Type Integrity**: All string fields are constrained in size (`.size() <= MAX`), and timestamp fields are validated.

## 2. The Dirty Dozen Payloads (Security Attack Scenarios)
1. **Identity Spoofing**: User A attempts to write a profile to `/users/UserB` with `request.auth.uid == 'UserA'`.
2. **Admin Privilege Escalation**: User A sets `role = 'admin'` during registration or update.
3. **Orphaned Write Attack**: Writing a chat message to another user's subcollection `/users/UserB/messages/msg1`.
4. **Junk ID Poisoning**: Creating document with a 2KB garbage string ID like `/users/{1000_chars_junk}`.
5. **Payload Oversizing Attack**: Writing a chat message content string greater than 10,000 characters.
6. **Shadow Field Injection**: Adding unapproved properties (e.g. `{ "isSuperUser": true }`) to user profile.
7. **Unauthenticated Read/Write**: Unauthenticated user trying to list or read `/users` or `/users/someUser/messages`.
8. **Blanket Query Scraping**: Executing a collection group query without scoping `resource.data.userId == request.auth.uid`.
9. **Tampering Immutables**: Attempting to alter `createdAt` on user profiles after creation.
10. **Null Pointer Trigger**: Sending malformed non-string content where string operations are evaluated.
11. **P层 Email Spoofing**: Unverified email attempting to execute restricted operations.
12. **Denial-of-Wallet Exhaustion**: Repeated nested document lookups in list queries.

## 3. Rule Architecture & Validation
All rules mandate `rules_version = '2';`, Master Gate helpers, strict `isValidId()` checks, schema validation helper functions (`isValidUser`, `isValidMessage`), and default deny `match /{document=**} { allow read, write: if false; }`.
