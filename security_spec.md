# protoX Games Firestore Security Specification

## 1. Data Invariants
1. A `UserProfile` document at `/users/{userId}` can only be read, created, or updated by the verified authenticated owner (`request.auth.uid == userId` and `email_verified == true`), and `users` collection listing is strictly denied to prevent PII scraping.
2. `UserProfile.uid` and `UserProfile.createdAt` are immutable once created, and initial `totalSupportedCents` on create must be `0`.
3. Every `SupportContribution` at `/users/{userId}/supports/{supportId}`, `PlaySession` at `/users/{userId}/playHistory/{gameId}`, and `FavoriteGame` at `/users/{userId}/favorites/{gameId}` requires the parent `/users/{userId}` document to exist (`Master Gate`), and `userId == request.auth.uid` and document ID == path ID.
4. `SupportContribution.amountCents` is strictly constrained to the allowlisted support tiers (`100`, `500`, `1000`, `10000`), and `currency` must be `'usd'`.
5. All document writes must strictly match the allowlisted keys (`hasAll` + `hasOnly` on create, `affectedKeys().hasOnly(...)` on update) and enforce type, length, regex, and server timestamp (`request.time`) invariants.

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated read of `/users/user1`.
2. Authenticated User A reading `/users/userB` (cross-user PII read).
3. Authenticated User listing `/users` collection.
4. Creating `/users/userA` with `uid: "userB"` (identity spoofing).
5. Creating `/users/userA` with an unverified email (`email_verified: false`).
6. Creating `/users/userA` with a ghost field `isAdmin: true` (shadow field injection).
7. Creating `/users/userA` with a client-forged `createdAt` string instead of `request.time`.
8. Updating `/users/userA` to mutate immutable `uid` or `createdAt`.
9. Creating `/users/userA/supports/s1` with `amountCents: 999999` (unallowlisted support amount).
10. Creating `/users/userA/playHistory/game1` when parent `/users/userA` does not exist (orphaned subcollection write).
11. Creating `/users/userA/playHistory/bad!id` with invalid path characters (`isValidId` failure).
12. Creating `/users/userA/favorites/game1` with `highScore: "999999"` or a 2,000-char `gameTitle` (type/size poisoning).
