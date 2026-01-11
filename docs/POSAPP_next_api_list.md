# POSAPP — Next API Roadmap (Platform + Tenant Management)

Scope: Product/Stock/Sales yo‘q. Faqat management + licensing + support.

## 0) Hozirgi holat (DONE)

### Tenant

- POST /bootstrap
- POST /auth/login
- POST /devices (owner/admin) # limit check (maxDevices)
- POST /devices/activate # deviceKey -> deviceToken, key rotate

### Platform

- POST /platform/auth/login
- POST /platform/tenants
- PATCH /platform/tenants/:id/max-devices
- POST /platform/devices/:id/reset-key # tokenVersion++ (revocation)

### Qoidalar (asosi)

- Lifetime model: base paket 1 store + 1 device, qo‘shimcha device uchun limit oshiriladi.
- Anti-fraud: reset bo‘lsa eski deviceToken darhol o‘ladi (tokenVersion mismatch).
- tokenType’lar ajratilgan: tenantUser vs platformAdmin vs device.

---

## 1) Dizayn prinsiplari (qattiq qoidalar)

1. Multi-tenant safety:
   - Tenant endpointlar har doim token’dagi tenantId bilan filter qilinadi.
   - Platform endpointlar global, lekin audit log + ehtiyotkor ruxsat.

2. Licensing strict:
   - active devices count hisoblanadi.
   - maxDevices dan oshsa -> device create blok.
   - Platform maxDevices ni activeCount’dan pastga tushira olmaydi.

3. Anti-fraud strict:
   - reset-key => tokenVersion++ (eski tokenlar 401).
   - activate => deviceKey rotate (1-time).

4. MVP: 1 tenant = 1 store (hozircha):
   - Store endpointlar qo‘shiladi, lekin create/update keyinroq.

---

## 2) Tenant API (mijoz admin paneli uchun)

Maqsad: mijoz o‘z do‘koni ichidagi “kassa + xodim”ni boshqara olsin.
Auth: tenantUser token (Authorization: Bearer ...)

### 2.1 “Kimman / Dashboard” (UI asos)

1. GET /me

- Role: owner/admin/cashier (hammasi)
- Maqsad: frontend user + tenant kontekstni tez oladi.
- Response (minimal):
  - user: {id, email, role, isActive}
  - tenant: {id, name, isActive}
  - store: {id, name, isActive}

2. GET /tenant/summary

- Role: owner/admin
- Maqsad: admin panel dashboard:
  - maxDevices, activeDevices
  - tenant/store status
- Response:
  - tenant: {id, name, isActive, maxDevices}
  - activeDevices: number
  - store: {id, name, isActive}

### 2.2 Stores (read-only, hozir 1 ta bo‘lsa ham kerak)

3. GET /stores

- Role: owner/admin
- Maqsad: kelajak multi-store’ga tayyor UI; hozir 1 ta qaytadi.

4. GET /stores/:id

- Role: owner/admin
- Rule: store.tenantId = token.tenantId

### 2.3 Devices (tenant “kassalar”ni ko‘rishi shart)

5. GET /devices

- Role: owner/admin
- Maqsad: kassalar ro‘yxati (POS-01, POS-02...)
- Query (MVP): ?q=POS&isActive=true
- Response item:
  - {id, storeId, deviceCode, isActive, tokenVersion, lastResetAt, lastSeenAt}

6. GET /devices/:id

- Role: owner/admin
- Maqsad: device detail (support uchun ham foydali)

7. PATCH /devices/:id/status

- Role: owner/admin
- Body: { isActive: boolean }
- Maqsad: tenant o‘zi kassani vaqtincha bloklay olsin (platformga yozmasdan).
- Qoidalar:
  - isActive=false bo‘lsa, device tokenlari guard’da 401/403 bo‘lib ketadi (DB check orqali).

> Eslatma: reset-key tenantga berilmaydi (xavfsizlik + support nazorat).
> Tenant faqat platformdan reset so‘raydi.

### 2.4 Users (staff) — admin/cashier yaratish

8. GET /users

- Role: owner/admin
- Maqsad: xodimlar ro‘yxati (cashier’lar, admin’lar)
- Response item:
  - {id, email, role, isActive, createdAt, lastLoginAt?}

9. POST /users

- Role: owner/admin
- Body: { email, password, role: "admin"|"cashier" }
- Maqsad: yangi xodim yaratish.
- Qoidalar:
  - role="owner" yaratish yo‘q (owner faqat bootstrap/platform orqali).
  - email unique per tenant.

10. PATCH /users/:id/status

- Role: owner/admin
- Body: { isActive: boolean }
- Maqsad: xodimni bloklash/ochish.

11. PATCH /users/:id/role

- Role: owner only
- Body: { role: "admin"|"cashier" }
- Maqsad: admin’ni cashier qilish (yoki aksincha).
- Qoidalar:
  - owner’ni rolini o‘zgartirish yo‘q.

12. PATCH /users/:id/password

- Role: owner/admin
- Body: { newPassword }
- Maqsad: cashier parolini reset qilish (real hayotda juda kerak).

---

## 3) Platform API (sizning platform-web/support panel)

Maqsad: tenant onboarding, licensing, support operatsiyalar, audit.
Auth: platformAdmin token (Authorization: Bearer ...)

### 3.1 Tenants (senda bor + kengaytiramiz)

A) Bor:

- GET /platform/tenants (search/pagination) [agar hozir yo‘q bo‘lsa, #1 qilib qo‘shiladi]
- GET /platform/tenants/:id (detail)
- PATCH /platform/tenants/:id/status
- PATCH /platform/tenants/:id/max-devices
- POST /platform/tenants (create)

B) Qo‘shiladi (support ekranlari uchun):

1. GET /platform/tenants/:id/devices

- Maqsad: tenant detail -> “Devices” tab.
- Response: devices[] (store nomi bilan join bo‘lsa zo‘r)

2. GET /platform/tenants/:id/users

- Maqsad: tenant detail -> “Users” tab.

3. GET /platform/tenants/:id/stores

- Maqsad: hozir 1 ta bo‘lsa ham, tenant detail’da ko‘rsatish.
- Keyin multi-store bo‘lganda ham shu ishlaydi.

### 3.2 Devices (support)

A) Bor:

- POST /platform/devices/:id/reset-key
- PATCH /platform/devices/:id/status [sendagi reference’da bor]

B) Qo‘shiladi:

4) GET /platform/devices/:id

- Maqsad: support device detail:
  - tokenVersion, lastResetAt, lastSeenAt, status
  - tenant/store info
- Juda muhim: “qaysi device ishlayapti?” savoliga javob.

5. POST /platform/devices/:id/reset-key (kuchaytirilgan body)

- Body (yangi):
  - { reason?: string }
- Maqsad: reset sababini audit’da saqlash (keyinchalik dispute bo‘lsa juda kerak).

### 3.3 Audit / Logs (MVP’da minimal, lekin puxta)

6. GET /platform/audit/device-resets

- Query: ?tenantId=&deviceId=&from=&to=
- Maqsad:
  - kim reset qildi
  - qachon
  - sabab (reason)
- Bu seni “mijoz aldadi”/“support tarixini bilish” muammosidan qutqaradi.

7. GET /platform/audit/admin-actions

- Query: ?tenantId=&action=&from=&to=
- Maqsad: platform adminlar qilgan kritik amallar (maxDevices change, tenant disable, device disable).

> Audit minimal bo‘lsa ham, keyin product bosqichida ham poydevor bo‘lib qoladi.

---

## 4) Endpointlar ustuvorligi (puxta tartib)

### Phase 1 — Tenant panel “ko‘rish” (tez qiymat)

- GET /me
- GET /tenant/summary
- GET /devices
- GET /users

### Phase 2 — Tenant staff boshqaruvi

- POST /users
- PATCH /users/:id/status
- PATCH /users/:id/password
- PATCH /users/:id/role (owner-only)

### Phase 3 — Tenant device boshqaruvi (safe)

- GET /devices/:id
- PATCH /devices/:id/status

### Phase 4 — Platform support ekranlarini to‘ldirish

- GET /platform/tenants/:id/devices
- GET /platform/tenants/:id/users
- GET /platform/devices/:id

### Phase 5 — Audit (katta farq qiladigan “professional” qadam)

- GET /platform/audit/device-resets
- GET /platform/audit/admin-actions

---

## 5) Acceptance criteria (test qilib “tayyor” deyish uchun)

1. Tenant owner/admin:
   - o‘z devices ro‘yxatini ko‘radi
   - o‘z cashier/admin larini yaratadi va bloklay oladi
2. Cashier:
   - admin panelda faqat “o‘ziga kerakli minimal” sahifalar (keyin POS flows)
3. Platform:
   - tenant detail’da devices/users ko‘rinadi
   - reset-key qilinsa audit’da yoziladi
4. Security:
   - tenant token bilan boshqa tenant ma’lumoti chiqmaydi (tenantId filter)
   - reset bo‘lsa eski deviceToken 401 (tokenVersion mismatch)

---
