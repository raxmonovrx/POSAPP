# POSAPP — MVP Flow & Platform Reja Jamlanmasi

> Ushbu hujjat POSAPP loyihasining hozirgacha kelishilgan **MVP arxitekturasi, sotish modeli, onboarding flow** va **super admin / tenant / store / device** boshqaruv rejasini jamlaydi.  
> Maqsad: product/stock/sales’ga o‘tishdan oldin **flow va licensing**ni 100% to‘g‘ri qurib olish.

---

## 0) Biznes model (Pricing)

- **Subscription yo‘q**
- **Lifetime**: mijoz 1 marta sotib oladi
- **Base paket ($500)**:
  - 1 ta do‘kon (1 store)
  - 1 ta admin panel (mijoz uchun)
  - **1 ta kassa (1 POS device)** limiti
- **Qo‘shimcha kassa**:
  - har qo‘shimcha POS device uchun **+$50–$100** (lifetime add-on)
- Do‘kon ichida kassalar soni oshsa, siz limitni oshirasiz.

---

## 1) Terminlar (aniq)

- **Platform Owner / Superadmin**: siz (tizim egasi)
- **Tenant**: bitta mijoz (kompaniya / do‘kon egasi)
- **Store**: bitta do‘kon (MVP’da default: 1 tenant = 1 store)
- **Device (POS Device)**: bitta kassa kompyuter (POS-01, POS-02, POS-03)
- **Tenant User**: mijozning owner/admin/cashier userlari

---

## 2) 1 do‘kon = 1 markaziy baza

- Markaziy DB: **server MySQL**
- POS offline ishlashi uchun har POS kompyuterda:
  - **SQLite local DB**
- Internet bo‘lganda:
  - POS’lar serverga sync qiladi
  - hamma ma’lumotlar bitta store DB’da birlashadi

---

## 3) Licensing (kassa limitini avtomatik boshqarish)

Tenant’da limit saqlanadi:

- `tenants.maxDevices` (default: `1`)

Qoidalar:

- `devicesCount < maxDevices` → yangi kassa qo‘shish mumkin
- `devicesCount >= maxDevices` → `POST /devices` bloklanadi
  - UI’da: “Limit tugadi, qo‘shimcha kassa sotib oling”

Bu pricing modelni avtomatik enforce qiladi:
- mijoz limitga uriladi → sizga yozadi → pul → limit oshadi

---

## 4) 2 xil panel va 2 xil auth

### A) Platform Admin (sizniki)
Siz butun platformani boshqarasiz:

- tenant yaratish
- tenant limitini oshirish (`maxDevices`)
- tenant active/deactive
- device reset/disable
- loglar (audit/error/sync)

Auth:

- `platform_admins` jadvali
- `/platform/auth/login`
- platform JWT (tenant tokenlardan alohida)

### B) Tenant Admin (mijozniki)
Mijoz faqat o‘z do‘koni ichida boshqaradi:

- users (admin/cashier)
- devices qo‘shish (limit ichida)
- keyin product/stock/sales (hozircha yo‘q)

Auth:

- `users` jadvali
- `/auth/login`
- tenant JWT

---

## 5) Onboarding flow (real ishlash ketma-ketligi)

### 5.1 Bootstrap — yangi do‘kon yaratish
Endpoint:

- `POST /bootstrap`

Yaratadi:

- tenant
- store
- owner user (tenant owner)
- default 1 device (POS-01)
- `maxDevices=1`

### 5.2 POS activation — kassani ulash
Endpoint:

- `POST /devices/activate`

POS yuboradi:

- `deviceKey`

Server:

- device mavjudligini tekshiradi
- device active ekanini tekshiradi

Qaytaradi:

- `deviceToken (JWT)`

POS endi sync endpointlariga faqat deviceToken bilan ulanadi.

### 5.3 Qo‘shimcha kassa qo‘shish (mijoz tomonidan)
Endpoint:

- `POST /devices` (tenant owner/admin)

Server:

- `maxDevices` limitni tekshiradi
- limit ichida bo‘lsa device yaratadi
- `deviceKey` beradi (activation uchun)

### 5.4 Qo‘shimcha kassani sotish (siz tomondan)
Endpoint:

- `PATCH /platform/tenants/:id/max-devices` (platform superadmin)

Siz limitni oshirasiz:

- `1 → 2 → 3 → ...`

Keyin mijoz admin paneldan qo‘shimcha device yaratishi mumkin bo‘ladi.

---

## 6) Hozirgi holat (qilingan ishlar)

- Infra: MySQL + Redis + phpMyAdmin docker-compose orqali ishlayapti
- NestJS API ishlayapti
- Entity/migration ishlayapti
- `POST /bootstrap` va `POST /auth/login` ishlayapti (Postman’da sinovdan o‘tgan)

---

## 7) Hozirgi fokus (Product’ga o‘tmaymiz)

Keyingi bosqichlar faqat management flow:

### Platform (Superadmin)
1) Platform admin auth (platform owner login)
2) Platform endpointlar:
   - tenant create
   - `maxDevices` update
   - tenant status (active/deactive)
   - device reset-key / disable
   - logs

### Tenant management (mijoz)
1) users create (cashier/admin)
2) devices create (limit check)
3) devices activate (POS)

---

## 8) Monorepo tuzilma

```
posapp/
  apps/
    api/                # NestJS (tenant API + /platform routes)
    admin-web/          # Tenant admin panel (mijozniki)
    platform-web/       # Platform admin panel (sizniki)
    pos-desktop/        # Electron POS (offline SQLite + sync)
  packages/
    shared/
  infra/
  docs/
```

MVP uchun: `/platform/*` route’lar `apps/api` ichida bo‘ladi. Keyin xohlasangiz alohida `platform-api`ga ajratiladi.

---

## 9) Keyingi boshlanadigan modul (navbat)

**Platform Admin (sizniki)**

- `platform_admins` jadvali + seed (first owner)
- `/platform/auth/login`
- `/platform/tenants` (create)
- `/platform/tenants/:id/max-devices` (update)
- minimal logs

---

**Versiya:** v1 (MVP flow)  
**Holat:** Flow & licensing tayyor, product bosqichi hali boshlanmagan
