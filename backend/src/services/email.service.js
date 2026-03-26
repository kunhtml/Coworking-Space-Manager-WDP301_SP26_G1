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

export const sendRegistrationEmail = async ({ to, fullName }) => {
  return sendWelcomeEmail({ to, fullName });
};

export const isEmailConfigured = () => {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
};

export default {
  sendRegistrationEmail,
  sendWelcomeEmail,
  isEmailConfigured,
  sendOtpEmail,
};
