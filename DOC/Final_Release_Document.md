# FINAL RELEASE DOCUMENT

## Project Information

- Project name: Coworking Space System
- Document type: Reverse-engineered Final Release Document
- Source of truth: `backend/`, `frontend/`, `DATABASE/`
- Baseline date: 2026-03-25

## I. Deliverable Package

| Deliverable | Repository location | Status | Notes |
| --- | --- | --- | --- |
| Source code | `backend/`, `frontend/` | Available | Day la ma nguon chinh cua he thong. |
| SRS | `DOC/SRS_Document.md` | Available | Tai lieu reverse-engineered theo implementation hien tai. |
| SDS | `DOC/SDS_Document.md` | Available | Tai lieu thiet ke reverse-engineered theo codebase hien tai. |
| Database seed | `DATABASE/` | Available | JSON seed cho `users`, `tables`, `bookings`, `orders`, `order_items`, `invoices`, `payments`, `menu_items`, `categories`. |
| Final Release Document | `DOC/Final_Release_Document.md` | Available | Tai lieu release hien tai. |
| Video demo | Not found in repository | Missing in repo | Neu can nop deliverable hoan chinh thi video demo can duoc bo sung ngoai repository. |

## II. Installation Guide

### 1. Prerequisites

- Node.js va npm
- MongoDB local hoac remote
- PayOS credentials neu muon chay QR payment that
- Gmail SMTP credentials neu muon gui OTP that

### 2. Backend Setup

#### Step 1: Install dependencies

```bash
cd backend
npm install
```

#### Step 2: Configure environment

Tao file `.env` trong `backend/` tu `backend/.env.example`.

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/coworking-space-system
JWT_SECRET=your_jwt_secret_key
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key
RESEND_API_KEY=re_xxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev
FRONTEND_URL=http://localhost:5173
```

Bien moi truong can luu y them theo implementation hien tai:

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | Yes | Cong backend, mac dinh 5000. |
| `MONGO_URI` hoac `MONGODB_URI` | Yes | Ket noi MongoDB. |
| `JWT_SECRET` | Yes | Ky va verify JWT. |
| `PAYOS_CLIENT_ID` | Optional | Bat QR PayOS neu du bo ba key. |
| `PAYOS_API_KEY` | Optional | Bat QR PayOS. |
| `PAYOS_CHECKSUM_KEY` | Optional | Bat QR PayOS. |
| `FRONTEND_URL` | Recommended | Tao return/cancel URL cho payment. |
| `GMAIL_USER` | Optional | Gui OTP email that. |
| `GMAIL_APP_PASSWORD` | Optional | Gui OTP email that. |
| `RESEND_API_KEY` | Optional | Ho tro helper registration email, hien chua duoc wiring vao register flow. |
| `EMAIL_FROM` | Optional | Dia chi gui email voi Resend. |

#### Step 3: Run backend

```bash
npm run dev
```

Hoac:

```bash
npm start
```

Backend se:

- Ket noi MongoDB.
- Mount API duoi `/api`.
- Bat scheduler auto-expire booking moi 5 phut.

### 3. Frontend Setup

#### Step 1: Install dependencies

```bash
cd frontend
npm install
```

#### Step 2: Configure frontend environment

Frontend hien tai chi doc mot bien moi truong chung:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Neu khong khai bao, frontend mac dinh dung `http://localhost:5000/api`.

#### Step 3: Run frontend

```bash
npm run dev
```

Hoac build production:

```bash
npm run build
npm run start
```

### 4. Run both frontend and backend

Repository co san script:

```bat
run-all.bat
```

Script nay mo 2 cua so command de chay backend va frontend. Luu y thong diep echo trong file batch noi backend chay port 3000, trong khi `.env.example` cua backend mac dinh la 5000.

### 5. Optional database seed

Backend co cac script seed:

```bash
cd backend
npm run seed:db
npm run seed:hourly
npm run seed:bookings:range
```

Du lieu goc de doi chieu nam trong thu muc `DATABASE/`.

## III. User Manual

### 1. Overview

He thong phuc vu 4 role:

| Role | Muc dich su dung |
| --- | --- |
| Guest | Xem thong tin cong khai, menu va khong gian, chuyen sang dang nhap/dang ky khi can dat cho. |
| Customer | Dat cho, goi mon, thanh toan booking/order, xem lich su, cap nhat thong tin tai khoan. |
| Staff | Van hanh tai quay, xu ly booking check-in, cap nhat table status, tao order/POS, thu tien, xem/export hoa don. |
| Admin | Quan ly user, spaces, menu/services va theo doi revenue/occupancy analytics. |

### 2. Workflow

#### Guest

1. Mo `/` de xem tong quan.
2. Vao `/spaces` de xem khong gian.
3. Vao `/menu` de xem thuc don cong khai.
4. Vao `/login` hoac `/register` de tro thanh customer.

#### Customer

1. Dang nhap hoac dang ky.
2. Vao `/order-table` de tim table con trong.
3. Xac nhan booking, backend tao booking `Pending` va invoice deposit.
4. He thong dieu huong sang `/payment/:bookingId`.
5. Thanh toan booking bang PayOS neu backend da cau hinh.
6. Vao `/menu` va chon booking de tao order dich vu.
7. He thong dieu huong sang `/payment/order/:orderId`.
8. Sau khi thanh toan, vao `/customer-dashboard/orders` de xem booking/order history va invoice summary.
9. Vao `/customer-dashboard/profile` de sua thong tin va `/customer-dashboard/password` de doi mat khau.

#### Staff

1. Dang nhap va vao `/staff-dashboard`.
2. Dung `/staff-dashboard/checkin` de check-in booking da xac nhan.
3. Dung `/staff-dashboard/tables` de xem seat map va doi status table khi can.
4. Dung `/staff-dashboard/orders` de xem danh sach order, cap nhat status, thu tien tai quay, xem/export hoa don.
5. Dung `/staff-dashboard/counter-pos` de tao walk-in order:
   - Chon table.
   - Nhap thong tin khach neu can.
   - Chon mon.
   - Chon `CASH` hoac `QR_PAYOS`.
6. Dung `/staff-dashboard/create-service` de tao service order nhanh theo table.
7. Dung `/staff-dashboard/services` de tra cuu danh sach menu/dich vu.
8. Dung `/staff-dashboard/profile` hoac `/staff-dashboard/password` de cap nhat tai khoan.

#### Admin

1. Dang nhap va vao `/admin` hoac `/dashboard`.
2. Dung `/admin-dashboard/users` de quan ly user.
3. Dung `/admin-dashboard/spaces` de quan ly tables/spaces.
4. Dung `/admin-dashboard/services` de quan ly menu items va categories.
5. Dung `/admin-dashboard/revenue` de xem bao cao doanh thu.
6. Dung `/admin-dashboard/occupancy` de xem lich cong suat theo thang va chi tiet tung ngay.
7. Dung `/admin-dashboard/profile` hoac `/admin-dashboard/password` de cap nhat tai khoan.

## IV. Release Notes

### Functional scope included in current repository

- Auth: login, register, get current user, update profile, change password, OTP send/verify APIs.
- Booking: search available tables, create booking, update own booking, list own booking, list all bookings cho staff/admin, check-in.
- Order: create/update customer order, staff order management.
- Payment: booking deposit PayOS, order PayOS, counter cash, counter QR PayOS, webhook sync.
- POS: walk-in booking + order + invoice flow cho staff.
- Reports: revenue analytics, hourly occupancy analytics, daily table usage.
- Admin management: users, spaces, categories, menu items.

### Current implementation notes

- `Forgot Password` la trang thong bao, chua co reset password workflow.
- Backend co OTP APIs, nhung frontend hien tai chua co man hinh nhap OTP; doi email qua profile UI se gap rang buoc OTP o backend.
- `PUT /api/auth/password` hien van hoat dong bang current/new/confirm password ma khong block neu OTP chua duoc verify.
- Mot so frontend request dang hardcode `http://localhost:5000`, can luu y khi deploy sang host khac.
- `AdminProfileNew.jsx` dang duoc tai su dung cho ca profile va password screens cua admin va staff.
- `frontend/src/pages/admin/AdminAnalytics.jsx` co trong codebase nhung chua duoc route den.
- Repository hien tai khong chua video demo.

### Operational notes

- PayOS chi hoat dong khi du credentials va webhook/return URL hop le.
- OTP email that chi gui duoc khi co `GMAIL_USER` va `GMAIL_APP_PASSWORD`; neu khong, backend log OTP ra console.
- Scheduler se auto-cancel booking `Pending` va `Awaiting_Payment` qua 30 phut.

## V. Acceptance Reference

Release duoc xem la chay dung theo code hien tai khi:

- Backend ket noi duoc MongoDB va start server thanh cong.
- Frontend truy cap duoc backend API dung base URL.
- Login theo role hoat dong.
- Booking, order, payment flows chay duoc theo role.
- Staff POS tao duoc order va hoa don.
- Admin truy cap duoc dashboards va CRUD pages.
