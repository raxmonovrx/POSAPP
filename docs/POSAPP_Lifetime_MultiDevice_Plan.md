# POSAPP — Sotish (Lifetime) modeli va Multi‑Kassa oqimi

> Ushbu hujjat POSAPP (Electron POS + NestJS backend) loyihasining **real hayotiy sotish modeli** va **kassa (device) ulash oqimi**ni aniq tushuntiradi.  
> Model: **oylik to‘lov yo‘q**, dastur **bir martalik (lifetime) sotiladi**. Qo‘shimcha kassalar (POS kompyuterlar) uchun **alohida qo‘shimcha to‘lov** olinadi.

---

## 1) Asosiy g‘oya (Business model)

### Sotiladigan paket
- **$500** — POSAPP (lifetime)
- Ichida:
  - 1 ta do‘kon (1 ta store)
  - 1 ta admin panel (owner/admin login)
  - **1 ta kassa (1 ta POS kompyuter)** ishlatish huquqi

### Qo‘shimcha sotiladigan narsa
- Agar do‘kon keyinroq kattalashsa va **2 yoki 3 ta kassa kerak bo‘lsa**:
  - Har qo‘shimcha kassa uchun **+$50–$100** (lifetime add-on)

---

## 2) Terminlar (muammosiz tushunish uchun)

> Bu terminlarni bir xil ishlatamiz — shunda arxitektura toza bo‘ladi.

- **Tenant** — mijoz kompaniya / do‘kon egasi (mijoz)
- **Store** — do‘kon (bitta filial / bitta baza)
- **POS Device** — kassa kompyuter (POS-01, POS-02, POS-03)

Muhim:
- Siz sotayotgan narsa **Store licenziyasi (lifetime)**.
- Kassalar soni — shu do‘kon ichidagi **Device’lar soni**.

---

## 3) “1 ta do‘kon = 1 ta baza” qoidasi

Sizning modelda:
- **1 ta store = 1 ta markaziy database (server MySQL)**
- Hamma kassa kompyuterlar (POS devices) **shu store’ga bog‘lanadi**

Demak:
- POS-01, POS-02, POS-03 → barchasi bir xil:
  - mahsulotlar (products)
  - qoldiq (stock)
  - sotuvlar (sales)
  - hisobotlar (reports)
  - admin panel

---

## 4) Offline va lokal baza (POS ichida)

POS har kompyuterda offline ishlashi uchun lokal baza bo‘ladi:

- **Server DB (MySQL)** — *asosiy do‘kon bazasi*
- **Local DB (SQLite)** — *har POS kompyuterning offline bazasi*

Misol:
- POS-01 kompyuter: `pos.sqlite`
- POS-02 kompyuter: `pos.sqlite`
- POS-03 kompyuter: `pos.sqlite`

Internet bo‘lganda:
- POS’lar server bilan **sync** qiladi va ma’lumotlar **bitta do‘kon DB**da birlashadi.

---

## 5) Real hayotiy misol (sotish va ishlatish oqimi)

### 5.1) Mijoz 1 ta kassa bilan sotib oladi ($500)
Mijoz: `Otabek Books`

Siz yaratib berasiz:
- Tenant: `Otabek Books`
- Store: `Main store`
- Owner user: `owner@otabek.uz`
- Kassalar limiti: `maxDevices = 1`
- Device: `POS-01`

Natija:
- 1 ta do‘kon
- 1 ta admin panel
- 1 ta kassa kompyuter

---

### 5.2) Mijoz keyin 3 ta kassa xohlaydi
Do‘kon kattalashdi, navbat ko‘paydi.

Mijoz so‘raydi:
- “Bizga 3 ta kassa kerak ekan.”

Siz:
- Qo‘shimcha 2 ta kassa sotib berasiz:
  - +$50–$100 × 2

Backend tomondan:
- `maxDevices: 1 → 3`

Mijoz admin paneldan:
- POS-02 yaratadi
- POS-03 yaratadi

Har bir kompyuterda:
- activation qilinadi

Natija:
- 1 ta do‘kon
- 1 ta bazaga ulangan 3 ta kassa
- parallel ishlaydi

---

## 6) Kassalar sonini boshqarish (licensing)

Sizning pricing model avtomatik ishlashi uchun backend’da limit bo‘ladi:

- `tenants.maxDevices` (default: 1)

Qoidalar:
- `count(devices) < maxDevices` → yangi kassa qo‘shsa bo‘ladi
- `count(devices) >= maxDevices` → yangi kassa qo‘shish bloklanadi  
  → admin panelda chiqadi:
  - “Kassa limiti tugadi. Qo‘shimcha kassa sotib oling.”

Bu juda foydali:
- siz qo‘lda nazorat qilmasdan ham “billing trigger” bo‘ladi.

---

## 7) Onboarding flow (backend va POS ulash)

### 7.1) Bootstrap (yangi do‘kon yaratish)
Endpoint:
- `POST /bootstrap`

Yaratadi:
- tenant
- store
- owner user
- default 1 device (POS-01)

---

### 7.2) POS activation (kassani ulash)
Endpoint:
- `POST /devices/activate`

POS yuboradi:
- `deviceKey`

Server tekshiradi:
- device mavjudmi?
- active mi?

Qaytaradi:
- `deviceToken (JWT)`

Shundan keyin POS:
- sync endpointlariga faqat deviceToken bilan ulanadi.

---

### 7.3) Qo‘shimcha kassa qo‘shish
Endpoint:
- `POST /devices`

Faqat owner/admin ishlatadi.

Server:
- `maxDevices` limit tekshiradi
- limit ichida bo‘lsa device yaratadi
- `deviceKey` qaytaradi (activation uchun)

---

### 7.4) Limit oshirish (siz uchun superadmin)
Endpoint:
- `PATCH /tenants/:id/max-devices`

Bu endpointni faqat siz ishlatasiz (platform owner).

---

## 8) Minimal endpointlar ro‘yxati (MVP)

### Auth
- `POST /auth/login`

### Onboarding
- `POST /bootstrap`

### Devices
- `POST /devices` (owner/admin)
- `POST /devices/activate` (POS)

### Licensing
- `PATCH /tenants/:id/max-devices` (superadmin)

---

## 9) Yakuniy xulosa
Bu model:
- subscription talab qilmaydi
- “lifetime purchase”ga 100% mos
- kassalar sonini `maxDevices` orqali professional nazorat qiladi
- do‘konda 3–5 ta kassa bo‘lsa ham bitta bazaga sync bo‘ladi
- sizga doimiy qo‘shimcha daromad (extra device add-on) beradi

---

**Muallif:** POSAPP loyiha konsepsiyasi  
**Versiya:** v1 (lifetime + multi-device plan)
