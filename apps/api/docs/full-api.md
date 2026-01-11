# POSAPP API (NestJS) — Onboarding & Licensing Reference

Applies to `apps/api` current MVP scope: bootstrap tenant/store/owner, tenant auth, device management (limit-aware), platform admin auth + tenant limit control. Product/stock/sales endpoints are not included yet.

## Environment & runtime
- Validation: global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`).
- Device codes are uppercased server-side; `deviceKey` is returned only when a device is created or reset and is rotated after activation (single-use).
- Device keys are stored hashed (SHA-256) in DB; raw keys are never persisted.
- Secrets & TTLs:
  - `JWT_ACCESS_SECRET` (fallback for tenant/platform/device if specific secrets are unset)
  - `JWT_ACCESS_TTL` (default `15m`)
  - `JWT_DEVICE_SECRET` (optional, else falls back) + `JWT_DEVICE_TTL` (default `30d`)
  - `PLATFORM_JWT_SECRET` (optional, else fallback) + `PLATFORM_JWT_TTL` (default `1d`)
- Seed first platform admin via env:
  - `PLATFORM_SEED_ADMIN_EMAIL=admin@posapp.test`
  - `PLATFORM_SEED_ADMIN_PASSWORD=StrongPass123`
  - Seed runs on app start if not already created.
- Migrations: `npm run db:mig:run` (tenants.maxDevices, platform_admins, device token versioning, device lastSeen, user lastLogin, device reset audit log, hashed device keys).

## Token types (JWT)
- Tenant user token (`tokenType=tenantUser`): payload `{ sub, tenantId, role, tokenType }`; used for tenant endpoints (`/auth/login`, `/devices`).
- Platform admin token (`tokenType=platformAdmin`): payload `{ sub, role: 'platformAdmin', tokenType }`; used for `/platform/*`.
- Device token (`tokenType=device`): payload `{ sub: deviceId, tenantId, storeId, tokenType, tokenVersion }`; validated against DB `devices.tokenVersion` to revoke old tokens after reset.

## Core entities (relevant fields)
- `tenants`: `id`, `name` (unique), `maxDevices` (default `1`), `isActive`.
- `stores`: `id`, `tenantId`, `name`, `isActive`.
- `devices`: `id`, `tenantId`, `storeId`, `deviceCode` (unique per tenant), `deviceKey` (unique), `tokenVersion` (int, default 1), `lastResetAt` (timestamp nullable), `lastSeenAt` (timestamp nullable), `isActive`.
- `users`: `id`, `tenantId`, `email` (unique per tenant), `passwordHash`, `role` (`owner|admin|cashier`), `isActive`, `lastLoginAt` (nullable).
- `platform_admins`: `id`, `email` (unique), `passwordHash`, `isActive`.
- `device_reset_audits`: `id`, `tenantId`, `deviceId`, `platformAdminId`, `reason?`, `createdAt`.

## Endpoints
### Tenant auth
- `POST /auth/login`
  - Body: `{"email":"owner@acme.test","password":"Secret123"}`
  - Response: `{"accessToken":"<JWT>","user":{"id":"...","tenantId":"...","email":"...","role":"owner"}}`

### Bootstrap (create tenant/store/owner/device)
- `POST /bootstrap`
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
      "device": { "id": "...", "deviceCode": "POS-01", "deviceKey": "returned_once" }
    }
    ```
  - Notes: runs in one transaction; rejects duplicate tenant name or owner email; `maxDevices` defaults to 1.

### Tenant panel basics (auth: tenant token)
- `GET /me` — user + tenant + first store
- `GET /tenant/summary` — owner/admin; returns tenant {id,name,isActive,maxDevices}, activeDevices, store
- `GET /stores` — owner/admin; list stores (MVP single store)
- `GET /stores/:id` — owner/admin; same-tenant only

### Devices (tenant panel)
- `POST /devices` — create additional device (owner/admin only)
  - Auth: `Authorization: Bearer <tenant accessToken>`
  - Body: `{"deviceCode":"POS-02"}` (optional `storeId` if multi-store later)
  - Response:
    ```json
    {
      "device": { "id": "...", "tenantId": "...", "storeId": "...", "deviceCode": "POS-02", "tokenVersion": 1 },
      "deviceKey": "activation_key",
      "currentDevices": 2,
      "maxDevices": 3
    }
    ```
  - Rules: counts active devices; if `currentDevices >= maxDevices` → `400 Device limit reached`; rejects duplicate code or inactive tenant/store.

- `GET /devices` — owner/admin, optional `?q=POS&isActive=true`; items include `{id, tenantId, storeId, deviceCode, isActive, tokenVersion, lastResetAt, lastSeenAt}`
- `GET /devices/:id` — owner/admin; returns device detail with store snippet
- `PATCH /devices/:id/status` — owner/admin; body `{ "isActive": true|false }`

- `POST /devices/activate` — POS activation with deviceKey
  - Body: `{"deviceKey":"activation_key"}`
  - Response:
    ```json
    {
      "deviceToken": "<JWT>",
      "device": { "id": "...", "tenantId": "...", "storeId": "...", "deviceCode": "POS-02", "tokenVersion": 1 }
    }
    ```
  - Rules: fails if device/tenant/store inactive or key unknown; `deviceKey` is rotated immediately after activation (cannot be reused). Device tokens embed `tokenVersion` and will be rejected if DB version changes.

### Users (tenant panel)
- `GET /users` — owner/admin; items: `{id,email,role,isActive,createdAt,lastLoginAt}`
- `POST /users` — owner/admin; body `{"email":"...","password":"...","role":"admin"|"cashier"}` (owner creation not allowed)
- `PATCH /users/:id/status` — owner/admin; body `{ "isActive": true|false }` (owner status cannot be changed)
- `PATCH /users/:id/role` — owner-only; body `{ "role": "admin"|"cashier" }` (cannot change owner)
- `PATCH /users/:id/password` — owner/admin; body `{ "newPassword": "Secret123" }`; target must be active

### Platform admin
- `POST /platform/auth/login`
  - Body: `{"email":"admin@posapp.test","password":"StrongPass123"}`
  - Response: `{"accessToken":"<JWT>","admin":{"id":"...","email":"admin@posapp.test"}}`

- `GET /platform/tenants` — optional `?q=Name`; list tenants
- `GET /platform/tenants/:id` — detail with store + activeDevices
- `POST /platform/tenants` — create tenant bundle (uses bootstrap internally)
  - Auth: `Authorization: Bearer <platform token>`
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
  - Response: same shape as `/bootstrap`, respects provided `maxDevices`.

- `PATCH /platform/tenants/:id/status` — activate/deactivate tenant
- `PATCH /platform/tenants/:id/max-devices` — adjust limit
  - Auth: `Authorization: Bearer <platform token>`
  - Body: `{"maxDevices":5}`
  - Response: `{"id":"...","name":"Client Co","maxDevices":5,"activeDevices":2}`
  - Rule: cannot set below current active device count; `maxDevices >= 1`.

- `GET /platform/tenants/:id/devices` — list devices (with store snippet)
- `GET /platform/tenants/:id/users` — list users
- `GET /platform/tenants/:id/stores` — list stores

- `GET /platform/devices/:id` — device detail (tokenVersion, lastResetAt, lastSeenAt, tenant/store info)
- `PATCH /platform/devices/:id/status` — set device active flag
- `POST /platform/devices/:id/reset-key` — rotate device key and revoke tokens
  - Auth: `Authorization: Bearer <platform token>`
  - Body: optional `{ "reason": "format" }`
  - Response:
    ```json
    {
      "device": { "id": "...", "tenantId": "...", "storeId": "...", "deviceCode": "POS-02", "tokenVersion": 2 },
      "deviceKey": "new_activation_key"
    }
    ```
  - Notes: increments `tokenVersion` (all old device tokens become invalid); returns new single-use `deviceKey`.

### Audit
- `GET /platform/audit/device-resets` — optional `?tenantId=&deviceId=`; returns reset history `{id,tenantId,deviceId,platformAdminId,reason,createdAt}`

## Typical flows
1) New client sale: call `/bootstrap` (or `/platform/tenants` from platform) → receive owner creds + POS-01 deviceKey → owner logs in via `/auth/login` → activate POS on device with `/devices/activate`.
2) Client buys extra devices: platform calls `PATCH /platform/tenants/:id/max-devices` to raise limit → tenant owner/admin calls `POST /devices` to get new deviceKey → on each POS, call `/devices/activate` (key rotates after use).
3) Device reset/format: platform calls `POST /platform/devices/:id/reset-key` → old device tokens die (tokenVersion mismatch) → new POS activates with returned key.

## Error patterns
- 400: validation errors, duplicate tenant/owner email, device limit reached, invalid device code duplication, maxDevices below active count.
- 401: bad credentials, inactive user/tenant/device/store, wrong tokenType for guard, device tokenVersion mismatch (revoked).
- 403: tenant role not allowed (creating device without owner/admin).

## Postman quick checks
- Set `{{baseUrl}}` (e.g., `http://localhost:3000`).
- Tenant auth: `POST {{baseUrl}}/auth/login` with owner credentials from bootstrap.
- Platform auth: `POST {{baseUrl}}/platform/auth/login` with seed admin credentials.
- Protected calls: add `Authorization: Bearer {{token}}`.

## Run & migrate
- From `apps/api`: `npm run db:mig:run` then `npm run start:dev` (or `npm run start` for prod). Ensure env secrets and DB are set.
