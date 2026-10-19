# ADR-004: Owner-Scoped Tenant Query Enforcement for BOLA/IDOR Prevention

## Decision Title
Enforce server-side user ownership scoping on every database read, update, and deletion operation.

## Context
Broken Object-Level Authorization (BOLA / IDOR, OWASP API Top 10 #1) occurs when an application exposes object identifiers (such as `/api/transactions/:id`) and fails to verify that the requesting user owns the requested record.

## Options Considered
1. **Client-Supplied Ownership Claims:** Trusting headers or body parameters sent by the frontend (`userId: req.body.userId`). Insecure and trivial to spoof.
2. **Post-Fetch Ownership Check in Controllers:** Fetching the row first (`SELECT * FROM table WHERE id = :id`), then comparing `row.userId === req.user.id`. Prone to developer oversight if a handler forgets the check.
3. **Repository-Level Enforced Scoping:** Injecting `WHERE user_id = :authUserId` into every SQL statement at the data access layer.

## Decision and Rationale
We selected **Option 3: Repository-Level Enforced Scoping**.  
- The authenticated `userId` is extracted exclusively from the verified JWT token (`req.user.id`) and injected directly into SQL queries.
- If a user attempts to access an ID belonging to another user, the query returns zero rows (404 Not Found), preventing data leaks and metadata enumeration.
- Automated security integration tests simulate cross-user attacks and block CI if any BOLA exploit succeeds.

## Consequences
- Positive: Absolute data isolation across tenants.
- Positive: Zero reliance on client-side security assertions.
- Trade-off: Developers must always pass `userId` to service repository methods.

## Ownership
- **Owner:** Engineer 1 (Auth, Security & Core Platform Architecture)
- **Review Date:** October 2026
- **Status:** Approved
