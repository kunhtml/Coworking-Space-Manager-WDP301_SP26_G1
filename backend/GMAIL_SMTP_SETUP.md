# Hướng dẫn setup Gmail SMTP (Backend)

Tài liệu này hướng dẫn cấu hình gửi email bằng **Nodemailer + Gmail SMTP** cho các luồng:

- Gửi OTP khi đăng ký tài khoản
- Gửi email chào mừng sau khi xác minh/đăng ký thành công
- Gửi OTP khi quên mật khẩu

## 1) Điều kiện cần

- Có tài khoản Gmail dùng để gửi mail
- Bật xác minh 2 bước (2-Step Verification) cho tài khoản Gmail
- Tạo **App Password** cho ứng dụng backend
- Backend đã cài package (`npm install` trong thư mục `backend`)

## 2) Tạo Gmail App Password

1. Đăng nhập tài khoản Gmail muốn dùng để gửi mail
2. Vào trang quản lý tài khoản Google: https://myaccount.google.com/
3. Mở mục **Security**
4. Bật **2-Step Verification** (nếu chưa bật)
5. Sau khi bật 2FA, vào **App passwords**
6. Chọn app bất kỳ (hoặc đặt custom name, ví dụ: `Coworking Backend`)
7. Copy mật khẩu 16 ký tự được tạo ra

Lưu ý:

- Không dùng mật khẩu Gmail thường để SMTP
- Chỉ dùng App Password

## 3) Cấu hình file .env

Tạo hoặc cập nhật file `backend/.env` với các biến sau:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/coworking-space-system
MONGO_URI=mongodb://localhost:27017/coworking-space-system
JWT_SECRET=dev_jwt_secret_change_me

# Gmail SMTP
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
EMAIL_FROM=your_gmail@gmail.com

# App
APP_NAME=Coworking Space
FRONTEND_URL=http://localhost:5173
```

Khuyến nghị:

- `EMAIL_FROM` nên trùng `GMAIL_USER`
- Không commit `.env` lên git

## 4) Chạy backend

Trong thư mục project root:

```bash
npm --prefix backend run dev
```

Hoặc vào trực tiếp thư mục backend:

```bash
cd backend
npm run dev
```

## 5) API test các luồng email

Base URL local: `http://localhost:5000/api`

### A. OTP đăng ký

1. Gửi OTP:

- `POST /auth/register/send-otp`
- Body:

```json
{
  "email": "user@example.com"
}
```

2. Xác minh OTP:

- `POST /auth/register/verify-otp`
- Body:

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

3. Đăng ký tài khoản:

- `POST /auth/register`
- Body ví dụ:

```json
{
  "fullName": "Nguyen Van A",
  "email": "user@example.com",
  "phone": "0900000000",
  "password": "123456",
  "confirmPassword": "123456",
  "role": "Customer"
}
```

Kết quả mong đợi:

- Tạo tài khoản thành công
- Gửi email chào mừng đến email vừa đăng ký

### B. OTP quên mật khẩu

1. Gửi OTP:

- `POST /auth/forgot-password/send-otp`

```json
{
  "email": "user@example.com"
}
```

2. Xác minh OTP:

- `POST /auth/forgot-password/verify-otp`

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

3. Đặt lại mật khẩu:

- `POST /auth/forgot-password/reset`

```json
{
  "email": "user@example.com",
  "newPassword": "654321",
  "confirmPassword": "654321"
}
```

## 6) Cơ chế fallback khi thiếu cấu hình Gmail

Nếu thiếu `GMAIL_USER` hoặc `GMAIL_APP_PASSWORD`, service email sẽ **không gửi thật** mà log nội dung mail ra console (mock mode).

Điều này giúp backend không bị crash khi môi trường dev chưa cấu hình SMTP đầy đủ.

## 7) Troubleshooting

### Không nhận được email

- Kiểm tra `GMAIL_USER` và `GMAIL_APP_PASSWORD` đúng chưa
- Đảm bảo tài khoản Gmail đã bật 2FA và App Password còn hiệu lực
- Kiểm tra mục Spam/Promotion
- Kiểm tra log backend có báo mock mode hay lỗi SMTP không

### Lỗi xác thực SMTP

- Tạo App Password mới và cập nhật lại `.env`
- Đảm bảo không copy dư khoảng trắng
- Restart backend sau khi đổi `.env`

### Gửi OTP thành công nhưng đăng ký báo chưa xác thực OTP

- Đảm bảo gọi đúng thứ tự: `send-otp` -> `verify-otp` -> `register`
- Không để OTP hết hạn (OTP mặc định hiệu lực 5 phút)

## 8) Khuyến nghị production

- Dùng SMTP account riêng cho hệ thống
- Rotate App Password định kỳ
- Giới hạn tần suất gọi endpoint gửi OTP (rate limit)
- Log ẩn dữ liệu nhạy cảm (email, OTP)
- Cân nhắc chuyển sang provider email transaction chuyên dụng khi scale lớn
