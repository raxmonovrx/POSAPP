# POSAPP API — Onboarding & Licensing (NestJS)

Key rules:

- `tenants.maxDevices` controls how many active devices a tenant can own (default `1`).
- Device codes are uppercased; `deviceKey` is only returned at creation/bootstrap/reset, stored hashed (SHA-256) in DB, and is single-use (rotated after activation).
- Tenant user tokens (`tokenType=tenantUser`), platform tokens (`tokenType=platformAdmin`), and device tokens (`tokenType=device`, carries `tokenVersion`) are separate.
- `deviceToken` revocation: payload tokenVersion must match DB `devices.tokenVersion`; reset-key increments version so old tokens 401.
- Set `PLATFORM_SEED_ADMIN_EMAIL` + `PLATFORM_SEED_ADMIN_PASSWORD` to auto-seed the first platform admin.

## Tenant auth

- `POST /auth/login`
  - Body:
    ```json
    { "email": "owner@acme.test", "password": "Secret123" }
    ```
  - Response:
    ```json
    {
      "accessToken": "JWT",
      "user": {
        "id": "...",
        "tenantId": "...",
        "email": "...",
        "role": "owner"
      }
    }
    ```

## Onboarding

- `POST /bootstrap` — Create tenant + store + owner + first device (`maxDevices` defaults to 1).
  - Body:
    ```json
    {
      "tenantName": "Otabek Books",
      "storeName": "Main Store",
      "ownerEmail": "owner@otabek.uz",
      "ownerPassword": "Secret123",
      "deviceCode": "POS-01"
    }
    ```
  - Response:
    ```json
    {
      "tenant": { "id": "...", "name": "Otabek Books", "maxDevices": 1 },
      "store": { "id": "...", "name": "Main Store" },
      "owner": { "id": "...", "email": "owner@otabek.uz", "role": "owner" },
      "device": {
        "id": "...",
        "deviceCode": "POS-01",
        "deviceKey": "returned_once"
      }
    }
    ```

## Tenant panel (tenant token)

- `GET /me` — current user + tenant + first store
- `GET /tenant/summary` — owner/admin; returns tenant {id,name,isActive,maxDevices}, activeDevices, store
- `GET /stores` — owner/admin, list stores (MVP single store)
- `GET /stores/:id` — owner/admin, same-tenant only

## Devices (tenant panel)

- `POST /devices` — Create extra device (requires `Authorization: Bearer <tenant accessToken>` and role owner/admin).
  - Body:
    ```json
    { "deviceCode": "POS-02" }
    ```
  - Response:
    ```json
    {
      "device": {
        "id": "...",
        "tenantId": "...",
        "storeId": "...",
        "deviceCode": "POS-02",
        "tokenVersion": 1
      },
      "deviceKey": "activation_key",
      "currentDevices": 2,
      "maxDevices": 3
    }
    ```
  - Rules: counts active devices; if `currentDevices >= maxDevices` returns `400 Device limit reached`.

- `GET /devices` — owner/admin, optional `?q=POS&isActive=true`
  - Items: `{id, tenantId, storeId, deviceCode, isActive, tokenVersion, lastResetAt, lastSeenAt}`
- `GET /devices/:id` — owner/admin, device detail (with store snippet)
- `PATCH /devices/:id/status` — owner/admin, body `{ "isActive": true|false }`

- `POST /devices/activate` — POS activation using `deviceKey` (no auth header).
  - Body:
    ```json
    { "deviceKey": "activation_key" }
    ```
  - Response:
    ```json
    {
      "deviceToken": "JWT",
      "device": {
        "id": "...",
        "tenantId": "...",
        "storeId": "...",
        "deviceCode": "POS-02",
        "tokenVersion": 1
      }
    }
    ```
  - Notes: `deviceKey` is rotated immediately after activation (cannot be reused). Use `deviceToken` for POS sync endpoints; token includes `tokenVersion` for revocation.

## Users (tenant panel)

- `GET /users` — owner/admin, list users `{id,email,role,isActive,createdAt,lastLoginAt}`
- `POST /users` — owner/admin, body `{ "email": "...", "password": "...", "role": "admin"|"cashier" }`
  - Rules: cannot create `owner`; email unique per tenant.
- `PATCH /users/:id/status` — owner/admin, body `{ "isActive": true|false }` (not allowed on owner)
- `PATCH /users/:id/role` — owner-only, body `{ "role": "admin"|"cashier" }`, cannot change owner
- `PATCH /users/:id/password` — owner/admin, body `{ "newPassword": "Secret123" }`, target must be active

## Platform admin

- `POST /platform/auth/login`
  - Body: `{ "email": "admin@posapp.test", "password": "Secret123" }`
  - Response: `{ "accessToken": "JWT", "admin": { "id": "...", "email": "admin@posapp.test" } }`

- `GET /platform/tenants` — optional `?q=Name`, list tenants
- `GET /platform/tenants/:id` — detail with store + activeDevices
- `POST /platform/tenants` — Create tenant bundle (requires platform token).
  - Body:
    ```json
    {
      "tenantName": "Client Co",
      "storeName": "HQ",
      "ownerEmail": "owner@client.co",
      "ownerPassword": "Secret123",
      "deviceCode": "POS-01",
      "maxDevices": 3
    }
    ```
  - Response: same shape as `/bootstrap` but respects provided `maxDevices`.

- `PATCH /platform/tenants/:id/status` — activate/deactivate tenant
- `PATCH /platform/tenants/:id/max-devices` — Update device limit (requires platform token).
  - Body: `{ "maxDevices": 5 }`
  - Response:
    ```json
    { "id": "...", "name": "Client Co", "maxDevices": 5, "activeDevices": 2 }
    ```
  - Rule: cannot set below current active device count.

- `GET /platform/tenants/:id/devices` — list devices (with store snippet)
- `GET /platform/tenants/:id/users` — list users
- `GET /platform/tenants/:id/stores` — list stores

- `GET /platform/devices/:id` — device detail (tenant/store info, tokenVersion, lastResetAt, lastSeenAt)
- `PATCH /platform/devices/:id/status` — set device active flag
- `POST /platform/devices/:id/reset-key` — Rotate deviceKey + revoke tokens (requires platform token).
  - Body (optional): `{ "reason": "format" }`
  - Response:
    ```json
    {
      "device": {
        "id": "...",
        "tenantId": "...",
        "storeId": "...",
        "deviceCode": "POS-02",
        "tokenVersion": 2
      },
      "deviceKey": "new_activation_key"
    }
    ```
  - Notes: increments `tokenVersion` so all existing device tokens are invalid; returns new single-use `deviceKey`.

- `GET /platform/audit/device-resets` — optional `?tenantId=&deviceId=`; returns audit of reset actions

## Migrations to run

- New migrations added:
  - `1768136276000-AddLicensingAndPlatformAdmin.ts` (adds `tenants.maxDevices` + `platform_admins`).
  - `1768136277000-AddDeviceTokenVersion.ts` (adds `devices.tokenVersion`, `devices.lastResetAt`).
  - `1768136278000-AddAuditAndUserDeviceMeta.ts` (adds `devices.lastSeenAt`, `users.lastLoginAt`, `device_reset_audits`).
  - `1768136279000-HashDeviceKey.ts` (stores device keys hashed, drops plain column).
- Run from `apps/api`: `npm run db:mig:run`
