# API contract

The contract is generated from the controllers and served by the API itself, so
it cannot describe an endpoint that does not exist or miss one that does:

| | |
| --- | --- |
| Deployed | https://mts-api-nhbe.onrender.com/docs |
| Local | http://localhost:3002/docs, with `pnpm dev` up |
| Raw spec | add `-json` to either, for OpenAPI 3.0 |

30 paths, 44 operations, 17 schemas. Any of them can be tried from the page
itself: press Authorize, paste a token from the login below, and the requests go
to the real database.

The deployed API sleeps after fifteen minutes on Render's free plan, so the first
request of the day takes about a minute to answer.

This page carries what a generated document cannot: how to get a token, what
holds for every endpoint, and what the errors mean in this domain.

## Getting started

```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"ana@citylogistics.co","password":"mts-dev-password"}'
```

That account and three others come from `pnpm seed`, which is the sandbox: a
fleet of six vehicles with a year of service history behind them. Every seeded
account uses the password `mts-dev-password`.

The reply carries the token and who it belongs to:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "principal": {
    "kind": "user",
    "id": 1,
    "fullName": "Ana Restrepo",
    "roleName": "Fleet coordinator",
    "permissions": ["view_vehicles", "manage_vehicles", "log_service"],
    "organizationId": 1
  }
}
```

Send it as `Authorization: Bearer <token>` on everything except register, login
and health.

## What holds for every endpoint

**Base path is `/api`.** JSON in, JSON out. Dates are calendar days as
`YYYY-MM-DD`, with no time and no timezone. There are no monetary amounts: the
schema stores no cost.

**A token carries an organization and every query is filtered by it.** No
endpoint reads across organizations and no parameter asks to. This is not a
convention the caller helps with, it is applied under every query.

**Bodies are validated before reaching any service.** A property the DTO does
not declare is a 400, not a value quietly dropped.

**Permissions are the client's to edit.** Nine of them, held by roles, and each
operation in the spec says which one it needs. A request from a role that does
not hold it is a 403, and the same request from a role that does is not.

**There are no rate limits and no pagination.** A fleet is between six and
twenty-four vehicles, so every collection returns whole. Both would be additions,
not changes, if a fleet ever outgrows that.

## Errors

Standard Nest shape, and the message is written to be shown to a person rather
than parsed:

```json
{ "statusCode": 409, "message": "Ana Restrepo has recorded 12 service events, so the account can only be retired", "error": "Conflict" }
```

| Code | In this API |
| --- | --- |
| 400 | The body does not match the schema, or the request would lock the caller out of their own organization |
| 401 | No token, or an expired one |
| 403 | Signed in, but the role does not hold the permission the operation needs |
| 404 | Not in your organization. Whether it exists elsewhere is not something a caller is entitled to learn, so this is never a 403 |
| 409 | A duplicate, or a deletion that would take history with it |

The 400 and 409 cases are deliberate refusals, not accidents. An organization
cannot delete a role somebody still holds, cannot take `manage_team` away from
the last role that has it, and nobody can change their own role or retire their
own account. Without those, a client can lock itself out of its own workspace and
only support can let it back in.
