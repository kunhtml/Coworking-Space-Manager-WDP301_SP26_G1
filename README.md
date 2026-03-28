# Coworking Space Manager

Hệ thống quản lý coworking space theo mô hình end-to-end cho 3 vai trò:

- Customer: đặt bàn, gọi món, thanh toán, theo dõi lịch sử.
- Staff: check-in, quản lý trạng thái bàn, tạo đơn tại quầy, xử lý thanh toán.
- Admin: quản trị user, không gian, dịch vụ, theo dõi báo cáo doanh thu và công suất.

Ứng dụng tách thành 2 lớp rõ ràng:

- Frontend: React Router v7 + React Bootstrap + Vite.
- Backend: Express + MongoDB (Mongoose) + JWT + PayOS + Gmail SMTP.

## 1. Kiến trúc tổng thể

### 1.1 Frontend

- Thư mục: frontend
- Trách nhiệm:
  - Giao diện và điều hướng theo role.
  - Gọi API qua service layer.
  - Quản lý trạng thái đăng nhập bằng localStorage.
- Công nghệ chính:
  - React 19
  - React Router 7
  - React Bootstrap
  - Vite

### 1.2 Backend

- Thư mục: backend
- Trách nhiệm:
  - Xử lý nghiệp vụ đặt bàn, order, thanh toán, báo cáo.
  - Phân quyền user bằng JWT middleware.
  - Kết nối PayOS và gửi email SMTP.
  - Scheduler tự động hủy booking quá hạn thanh toán.
- Công nghệ chính:
  - Node.js + Express
  - MongoDB + Mongoose
  - JWT
  - Nodemailer (Gmail SMTP)
  - PayOS SDK

### 1.3 Cấu trúc thư mục chính

```text
.
|-- backend/
|   |-- src/
|   |   |-- config/
|   |   |-- constants/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- scripts/
|   |   |-- services/
|   |   |-- utils/
|   |   |-- scheduler.js
|   |   \-- server.js
|   |-- .env.example
|   \-- GMAIL_SMTP_SETUP.md
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- store/
|   |   |-- routes.js
|   |   \-- styles.css
|   \-- package.json
|-- DATABASE/
|-- run-all.bat
\-- README.md
```

## 2. Toàn bộ chức năng hệ thống

## 2.1 Authentication và tài khoản

- Đăng ký tài khoản customer có OTP email.
- Đăng nhập bằng email hoặc số điện thoại.
- Lấy thông tin user hiện tại.
- Cập nhật hồ sơ cá nhân.
- Đổi email có xác thực OTP email mới.
- Đổi mật khẩu có xác thực OTP theo mục đích.
- Quên mật khẩu:
  - Gửi OTP
  - Verify OTP
  - Đặt lại mật khẩu
- Phân quyền route theo middleware:
  - requireAuth
  - requireStaff
  - requireAdmin

## 2.2 Chức năng Customer

### Đặt bàn

- Tìm bàn trống theo ngày/giờ/thời lượng (chống trùng lịch).
- Tạo booking với mã booking.
- Tạo hóa đơn booking ngay khi đặt.
- Cập nhật booking của chính mình khi chưa bị khóa trạng thái.
- Xem lịch sử booking cá nhân.

### Gọi món

- Xem menu public theo danh mục active.
- Chỉ cho phép tạo order khi booking đã hợp lệ thanh toán.
- Tạo order từ nhiều món, tính tổng tiền.
- Cập nhật order khi trạng thái cho phép.
- Xem lịch sử order và trạng thái thanh toán.

### Thanh toán

- Thanh toán booking bằng PayOS (QR/link).
- Thanh toán order bằng PayOS (QR/link).
- Hủy thanh toán pending.
- Xem trang thanh toán có đồng bộ trạng thái gần realtime.

## 2.3 Chức năng Staff

### Dashboard và vận hành bàn

- Dashboard thống kê nhanh đơn hàng/bàn.
- Xem danh sách bàn theo trạng thái.
- Cập nhật trạng thái bàn:
  - Available
  - Occupied
  - Reserved
  - Cleaning
  - Maintenance

### Booking và check-in

- Xem danh sách booking toàn hệ thống theo bộ lọc.
- Check-in booking từ staff dashboard.
- Lưu vết check-in:
  - Ai check-in (staff nào)
  - Thời điểm check-in
- Hiển thị thông tin staff check-in trên giao diện quản lý booking/check-in.

### Order và POS tại quầy

- Xem và quản lý đơn staff (lọc theo ngày, trạng thái, bàn).
- Tạo counter order (walk-in hoặc gắn booking).
- Cập nhật trạng thái order theo nghiệp vụ.
- Xem hóa đơn order.
- Export hóa đơn CSV.

### Thanh toán tại quầy

- Hỗ trợ CASH hoặc QR_PAYOS.
- Tạo link QR PayOS cho đơn tại quầy.
- Thu tiền mặt, cập nhật invoice/payment/order.
- Gửi email xác nhận thanh toán thành công cho khách (nếu có email).

## 2.4 Chức năng Admin

### Quản lý người dùng

- Xem danh sách user theo search, role, trạng thái.
- Tạo user mới.
- Cập nhật user.
- Vô hiệu hóa user.
- Khi admin tạo tài khoản Staff:
  - Tự động gửi email thông báo tài khoản staff (email đăng nhập + mật khẩu tạm thời).

### Quản lý không gian

- CRUD bàn.
- CRUD loại bàn (table type).
- Gắn dung lượng sức chứa theo loại bàn.
- Hỗ trợ ẩn loại bàn khỏi luồng public.

### Quản lý dịch vụ/menu

- CRUD món.
- CRUD danh mục.
- Quản lý tồn kho và availability status.

### Báo cáo và thống kê

- Báo cáo doanh thu theo Ngày/Tuần/Tháng/Năm.
- Doanh thu booking + order + giao dịch thành công.
- So sánh tháng chọn với tháng trước:
  - doanh thu tháng hiện tại
  - chênh lệch tuyệt đối
  - phần trăm tăng/giảm
- Công suất theo giờ (hourly occupancy).
- Lịch lấp đầy bàn theo ngày trong tháng.

## 2.5 Tự động hóa hệ thống

- Scheduler định kỳ:
  - Tự động hủy booking quá thời gian giữ chỗ nhưng chưa thanh toán.
  - Đồng bộ trạng thái payment/invoice liên quan.
- Một số luồng staff cũng có auto-cancel order pending quá hạn.

## 2.6 Thông báo Email

- OTP email cho đăng ký, quên mật khẩu, cập nhật profile.
- Email chào mừng sau đăng ký thành công.
- Email thông báo khi admin tạo tài khoản staff.
- Email xác nhận thanh toán thành công:
  - Booking: có mã booking.
  - Order: có mã order hiển thị trong mail.

Lưu ý: nếu chưa cấu hình Gmail SMTP, hệ thống chạy mock mode và log email ra console backend.

## 3. API modules chính

Các nhóm API được mount tại tiền tố: /api

- /auth: đăng nhập, đăng ký, OTP, hồ sơ, mật khẩu.
- /tables, /table-types: quản lý bàn và loại bàn.
- /bookings: booking customer + danh sách booking staff/admin + check-in.
- /orders: order customer.
- /payments: thanh toán booking/order, hủy thanh toán.
- /staff/dashboard/\*: API nghiệp vụ staff.
- /staff/payment/counter: thanh toán tại quầy.
- /reports/analytics\*: API báo cáo admin.
- /menu/\*: món và danh mục.
- /users: quản lý user (admin).

## 4. Cài đặt và chạy dự án

## 4.1 Yêu cầu môi trường

- Node.js 18+ (khuyến nghị 20+)
- npm
- MongoDB

## 4.2 Cấu hình backend

Tạo file backend/.env từ backend/.env.example và điền các giá trị cần thiết:

- PORT
- MONGO_URI
- JWT_SECRET
- PAYOS_CLIENT_ID
- PAYOS_API_KEY
- PAYOS_CHECKSUM_KEY
- GMAIL_USER
- GMAIL_APP_PASSWORD
- EMAIL_FROM
- FRONTEND_URL
- APP_NAME

Tài liệu SMTP chi tiết: backend/GMAIL_SMTP_SETUP.md

## 4.3 Cài dependencies

```bash
npm --prefix backend install
npm --prefix frontend install
```

## 4.4 Chạy nhanh cả hệ thống

```bash
run-all.bat
```

## 4.5 Chạy thủ công

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Mặc định:

- Backend: http://localhost:5000
- Frontend: http://localhost:5173

## 4.6 Build frontend production

```bash
cd frontend
npm run build
npm run start
```

## 5. Scripts hữu ích

Trong backend/package.json:

- npm run dev: chạy backend với nodemon.
- npm run start: chạy backend production mode.
- npm run seed:db: seed database từ file JSON.
- npm run seed:tables: seed tables.
- npm run seed:table-types: seed table types.
- npm run seed:hourly: seed dữ liệu analytics theo giờ.
- Các script migrate xóa field cũ trong collection tables.

## 6. Mô hình dữ liệu cốt lõi

Các model chính:

- User
- Table
- TableType
- Booking
- Order
- OrderItem
- Invoice
- Payment
- MenuItem
- Category

Quan hệ nghiệp vụ chính:

- Booking gắn với User và Table.
- Order gắn với Booking và User.
- Invoice có thể thuộc Booking hoặc chứa nhiều Order.
- Payment gắn Invoice, theo dõi trạng thái thanh toán chi tiết.

## 7. Ghi chú triển khai

- Timezone server đặt theo Asia/Ho_Chi_Minh.
- Frontend gọi API qua BASE_URL:
  - mặc định: http://localhost:5000/api
  - có thể override bằng VITE_API_BASE_URL.
- PayOS webhook endpoint:
  - POST /api/payos/webhook
- Một số trạng thái legacy Canceled/Cancelled vẫn được xử lý tương thích.

## 8. Tài liệu liên quan

- backend/README.md
- frontend/README.md
- backend/GMAIL_SMTP_SETUP.md
- DEMO_SAN_PHAM_END_TO_END.md
- SWIMLANE_DIAGRAM.md
