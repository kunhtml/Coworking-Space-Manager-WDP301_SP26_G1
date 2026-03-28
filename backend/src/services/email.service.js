import nodemailer from "nodemailer";

const createGmailTransporter = () => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user,
      pass,
    },
  });
};

const getPurposeText = (purpose) => {
  const normalized = String(purpose || "")
    .trim()
    .toUpperCase();

  if (normalized === "REGISTER") return "đăng ký tài khoản";
  if (normalized === "FORGOT_PASSWORD") return "quên mật khẩu";
  if (normalized === "UPDATE_PROFILE") return "cập nhật hồ sơ";
  if (normalized === "UPDATE_EMAIL") return "đổi email hồ sơ";
  if (normalized === "CHANGE_PASSWORD") return "đổi mật khẩu";
  return "xác thực";
};

const formatVnd = (amount) =>
  `${new Intl.NumberFormat("vi-VN").format(Math.round(Number(amount || 0)))}đ`;

const formatDateTimeVi = (dateValue) => {
  if (!dateValue) return "--";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = createGmailTransporter();

  if (!transporter) {
    console.log("=".repeat(60));
    console.log("EMAIL MOCK (missing GMAIL_USER/GMAIL_APP_PASSWORD)");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Text:", text);
    console.log("=".repeat(60));
    return { success: true, mocked: true };
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.GMAIL_USER,
    to,
    subject,
    text,
    html,
  });

  return { success: true };
};

export const sendOtpEmail = async ({ to, otpCode, purpose }) => {
  const appName = process.env.APP_NAME || "Coworking Space";
  const purposeText = getPurposeText(purpose);

  const subject = `[${appName}] Mã OTP ${purposeText}`;
  const text = `Mã OTP của bạn là: ${otpCode}. Mã có hiệu lực trong 5 phút. Nếu bạn không yêu cầu thao tác này, vui lòng bỏ qua email.`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
      <h2 style="margin-bottom:8px">${appName}</h2>
      <p>Bạn vừa yêu cầu OTP cho thao tác <strong>${purposeText}</strong>.</p>
      <p>Mã OTP của bạn:</p>
      <p style="font-size:30px;font-weight:700;letter-spacing:6px;margin:10px 0;color:#111827">${otpCode}</p>
      <p>Mã có hiệu lực trong <strong>5 phút</strong>.</p>
      <p>Nếu bạn không yêu cầu thao tác này, vui lòng bỏ qua email.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
};

export const sendWelcomeEmail = async ({ to, fullName }) => {
  const appName = process.env.APP_NAME || "Coworking Space";
  const loginUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`;
  const safeName = String(fullName || "Bạn").trim();

  const subject = `[${appName}] Chào mừng bạn đã đăng ký thành công`;
  const text = `Xin chào ${safeName},\n\nTài khoản của bạn đã được xác minh và tạo thành công tại ${appName}.\nBạn có thể đăng nhập tại: ${loginUrl}\n\nCảm ơn bạn đã sử dụng dịch vụ.`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
      <h2 style="margin-bottom:8px">${appName}</h2>
      <p>Xin chào <strong>${safeName}</strong>,</p>
      <p>Tài khoản của bạn đã được <strong>xác minh thành công</strong>.</p>
      <p>Chào mừng bạn đến với ${appName} 🎉</p>
      <p>
        <a href="${loginUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">
          Đăng nhập ngay
        </a>
      </p>
      <p>Nếu bạn cần hỗ trợ, vui lòng liên hệ đội ngũ của chúng tôi.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
};

export const sendStaffAccountCreatedEmail = async ({
  to,
  fullName,
  loginEmail,
  temporaryPassword,
  createdBy,
}) => {
  const appName = process.env.APP_NAME || "Coworking Space";
  const loginUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`;
  const safeName = String(fullName || "Bạn").trim();
  const creatorName = String(createdBy || "Quản trị viên").trim();

  const subject = `[${appName}] Tài khoản Staff của bạn đã được tạo`;
  const text = `Xin chào ${safeName},\n\n${creatorName} vừa tạo tài khoản Staff cho bạn tại ${appName}.\nThông tin đăng nhập:\n- Email: ${loginEmail}\n- Mật khẩu tạm thời: ${temporaryPassword}\n\nVui lòng đăng nhập tại ${loginUrl} và đổi mật khẩu ngay sau lần đăng nhập đầu tiên.`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
      <h2 style="margin-bottom:8px">${appName}</h2>
      <p>Xin chào <strong>${safeName}</strong>,</p>
      <p><strong>${creatorName}</strong> vừa tạo tài khoản <strong>Staff</strong> cho bạn.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;margin:14px 0">
        <p style="margin:0 0 6px 0"><strong>Email đăng nhập:</strong> ${loginEmail}</p>
        <p style="margin:0"><strong>Mật khẩu tạm thời:</strong> ${temporaryPassword}</p>
      </div>
      <p>Vui lòng đổi mật khẩu ngay sau khi đăng nhập để bảo mật tài khoản.</p>
      <p>
        <a href="${loginUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">
          Đăng nhập ngay
        </a>
      </p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
};

export const sendPaymentSuccessEmail = async ({
  to,
  customerName,
  paymentType,
  bookingCode,
  orderCode,
  amount,
  paymentMethod,
  paidAt,
}) => {
  const appName = process.env.APP_NAME || "Coworking Space";
  const safeName = String(customerName || "Khách hàng").trim();
  const normalizedType = String(paymentType || "ORDER").trim().toUpperCase();
  const typeLabel = normalizedType === "BOOKING" ? "đặt bàn" : "đơn dịch vụ";
  const referenceCode =
    normalizedType === "BOOKING"
      ? bookingCode || "--"
      : orderCode || bookingCode || "--";

  const subject = `[${appName}] Thanh toán ${typeLabel} thành công`;
  const text = `Xin chào ${safeName},\n\nHệ thống xác nhận bạn đã thanh toán thành công ${typeLabel}.\n- Mã tham chiếu: ${referenceCode}\n- Số tiền: ${formatVnd(amount)}\n- Phương thức: ${paymentMethod || "--"}\n- Thời gian: ${formatDateTimeVi(paidAt)}\n\nCảm ơn bạn đã sử dụng dịch vụ.`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
      <h2 style="margin-bottom:8px">${appName}</h2>
      <p>Xin chào <strong>${safeName}</strong>,</p>
      <p>Bạn đã thanh toán <strong>thành công</strong> cho ${typeLabel}.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;margin:14px 0">
        <p style="margin:0 0 6px 0"><strong>Mã tham chiếu:</strong> ${referenceCode}</p>
        <p style="margin:0 0 6px 0"><strong>Số tiền:</strong> ${formatVnd(amount)}</p>
        <p style="margin:0 0 6px 0"><strong>Phương thức:</strong> ${paymentMethod || "--"}</p>
        <p style="margin:0"><strong>Thời gian:</strong> ${formatDateTimeVi(paidAt)}</p>
      </div>
      <p>Cảm ơn bạn đã sử dụng dịch vụ.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
};

export const sendRegistrationEmail = async ({ to, fullName }) => {
  return sendWelcomeEmail({ to, fullName });
};

export const isEmailConfigured = () => {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
};

export default {
  sendRegistrationEmail,
  sendWelcomeEmail,
  sendStaffAccountCreatedEmail,
  sendPaymentSuccessEmail,
  isEmailConfigured,
  sendOtpEmail,
};
