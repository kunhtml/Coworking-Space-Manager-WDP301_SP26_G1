# Nexus Coworking Space Manager

Hệ thống quản lý và đặt chỗ không gian làm việc chung (Coworking Space) được xây dựng bằng React Router v7, React Bootstrap và TypeScript.

## Tính năng

- 🏢 **Trang chủ**: Giới thiệu về không gian làm việc, bảng giá và form đặt chỗ nhanh.
- 🛋️ **Danh sách không gian**: Hiển thị các loại không gian làm việc (Hot Desk, Dedicated Desk, Meeting Room, Private Office) cùng với tiện ích đi kèm.
- 📊 **Quản lý đặt chỗ (Dashboard)**: Dành cho người dùng xem lại lịch sử đặt chỗ, trạng thái thanh toán và quản lý các booking của mình.
- 📱 **Responsive Design**: Giao diện tương thích với mọi thiết bị (Mobile, Tablet, Desktop) nhờ React Bootstrap.

## Công nghệ sử dụng

- **Framework**: React Router v7 (Full-stack React framework)
- **UI Library**: React Bootstrap, Bootstrap 5
- **Ngôn ngữ**: TypeScript
- **Build Tool**: Vite

## Cài đặt và Chạy dự án

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Chạy môi trường phát triển (Development)

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`.

### 3. Build cho Production

```bash
npm run build
```

### 4. Chạy Production Server

```bash
npm run start
```

## Cấu trúc thư mục chính

```
app/
├── app.css           # Global styles
├── root.tsx          # Root layout của ứng dụng
├── routes.ts         # Cấu hình routing
└── routes/
    ├── home.tsx      # Trang chủ & Form đặt chỗ
    ├── spaces.tsx    # Trang danh sách không gian làm việc
    └── dashboard.tsx # Trang quản lý đặt chỗ của người dùng
```
