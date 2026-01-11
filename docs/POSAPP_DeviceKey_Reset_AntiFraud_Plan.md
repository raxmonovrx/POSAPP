# POSAPP — Device Key (1‑time) + Anti‑Fraud Reset Plan

Maqsad: `deviceKey` faqat **1 marta** ishlatiladigan “pairing key” bo‘lsin. Mijoz kompyuterini format qilsa yoki yangi kompyuter olsa, **platform admin** `reset-key` orqali yangi key beradi. Shu bilan birga, mijoz aldab **eski POS**ni ham ishlatib qolmasligi uchun **eski device tokenlar darhol bekor bo‘lishi** kerak.

---

## 1) Asosiy qoidalar

### 1.1 `deviceKey` — pairing uchun, 1 martalik
- `deviceKey` **faqat** device yaratishda (`/bootstrap`, `POST /devices`) yoki platform resetda (`/platform/devices/:id/reset-key`) qaytariladi.
- `POST /devices/activate` muvaffaqiyatli bo‘lgach, `deviceKey` **yaroqsiz** bo‘lishi shart.

### 1.2 “Format bo‘ldi” bahonasida aldash muammosi
Agar `deviceKey`ni reset qilsak-u, lekin eski POS’da oldingi `deviceToken` (JWT) hali TTL davomida ishlasa:
- mijoz yangi kompyuterni ham ulab oladi,
- eski kompyuter ham ishlashda davom etadi,
- natijada bitta kassani “klon” qilib ishlatadi.

Buni **token revocation** bilan yopamiz.

---

## 2) Yechim: Device Token Revocation (tokenVersion)

### 2.1 DB o‘zgarishi
`devices` jadvaliga qo‘shiladi:

- `tokenVersion INT NOT NULL DEFAULT 1`

(Ixtiyoriy)
- `lastResetAt TIMESTAMP NULL`

### 2.2 Device token payload
`deviceToken` (JWT) payload’iga qo‘shiladi:

- `tokenType: "device"`
- `sub: deviceId`
- `tenantId`
- `storeId`
- `tokenVersion`

### 2.3 Verifikatsiya qoidasi (DeviceJwtStrategy/Guard)
Har bir POS request (sync endpointlar) uchun:
1) JWT validate qilinadi
2) DB’dan `devices` yozuvi olinadi
3) Tekshiriladi:
   - `device.isActive === true`
   - `tenant.isActive === true`
   - `store.isActive === true`
   - **`payload.tokenVersion === device.tokenVersion`**
4) Mismatch bo‘lsa → **401 Unauthorized** (token bekor)

Shu bilan reset bo‘lganda eski tokenlar **darhol** o‘ladi.

---

## 3) Activate flow: key rotate (1 martalik qilish)

Endpoint: `POST /devices/activate`

**Muvaffaqiyatli activate** bo‘lgach:
- `deviceKey` rotate qilinadi:
  - DB’da `device.deviceKey = <newRandomKey>`
  - eski `deviceKey` endi ishlamaydi
- `deviceToken` qaytariladi (tokenVersion bilan)

Natija:
- 1 ta key bilan 2 ta kompyuter parallel activate qila olmaydi.

---

## 4) Reset-key flow: fraud’ga qarshi

Endpoint: `POST /platform/devices/:id/reset-key`

Bu endpoint:
1) `deviceKey`ni yangilaydi (new random)
2) **`tokenVersion = tokenVersion + 1`**
3) (ixtiyoriy) `lastResetAt = now()`
4) yangi `deviceKey`ni **faqat 1 marta** response’da qaytaradi

Natija:
- eski POS’dagi oldingi tokenlar `tokenVersion` mismatch sababli **darhol 401** bo‘ladi
- faqat yangi activate qilingan POS ishlaydi

---

## 5) Qo‘shimcha tavsiyalar (hardening)

### 5.1 Reset audit log
Saqlash:
- kim reset qildi (platform admin id)
- qachon
- (ixtiyoriy) sabab

### 5.2 Cooldown / rate limit
Masalan:
- 1 device’ga 24 soatda 1 martadan ko‘p reset bo‘lmasin
- yoki faqat `platform owner` reset qila olsin

### 5.3 Reset paytida vaqtincha disable (ixtiyoriy)
Reset paytida:
- `device.isActive=false`
Activate muvaffaqiyatli bo‘lganda:
- `device.isActive=true`

Bu “eski qurilma ishlashda davom etmasin”ni yanada kuchaytiradi.

---

## 6) Implementation checklist (MVP)

1) Migration:
   - `ALTER TABLE devices ADD tokenVersion INT NOT NULL DEFAULT 1;`
2) `activate()`:
   - key rotate
   - deviceToken payload’iga `tokenVersion` qo‘shish
3) `DeviceJwtStrategy` + `DeviceAuthGuard`:
   - `tokenType === "device"`
   - `tokenVersion` DB bilan mos bo‘lishi
4) `POST /platform/devices/:id/reset-key`:
   - key rotate + `tokenVersion++`
   - (optional) audit log

---

## 7) Operatsion qoida (real hayot)
- Siz POS-01’ni o‘rnatib berasiz (mijozga key tarqatmaysiz).
- Mijoz “format bo‘ldi” desa:
  - siz `reset-key` qilasiz
  - eski POS tokenlari o‘ladi
  - yangi kompyuter 1-martalik key bilan activate qiladi
- Mijoz aldamoqchi bo‘lsa ham:
  - eski qurilma endi ishlamaydi (401)
