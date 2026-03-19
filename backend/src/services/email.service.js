import { Resend } from "resend";

/**
 * Email Service using Resend API
 * https://resend.com/docs
 */

// Create Resend client
const createResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    console.warn("Resend API key not configured. Emails will be logged to console only.");
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
};

/**
 * Generate HTML email template for registration
 */
const generateRegistrationEmailHtml = ({ fullName, to, appName, loginUrl }) => {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chao mung ban den voi ${appName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #2c3e50; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                ${appName}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 24px;">
                Chao mung ${fullName}!
              </h2>
              
              <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                Cam on ban da dang ky tai khoan tai <strong>${appName}</strong>. Tai khoan cua ban da duoc tao thanh cong!
              </p>
              
              <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                Voi tai khoan nay, ban co the:
              </p>
              
              <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #555555; font-size: 16px; line-height: 1.8;">
                <li>Dat cho khong gian lam viec</li>
                <li>Quan ly lich dat cho cua ban</li>
                <li>Dat mon an va do uong</li>
                <li>Theo doi lich su thanh toan</li>
              </ul>
              
              <p style="margin: 0 0 25px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                Hay dang nhap ngay de bat dau trai nghiem dich vu cua chung toi!
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}/login" 
                       style="display: inline-block; padding: 14px 30px; background-color: #d4a373; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 5px;">
                      Dang nhap ngay
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Info Box -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 5px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                      <strong>Thong tin tai khoan:</strong>
                    </p>
                    <p style="margin: 0; color: #666666; font-size: 14px;">
                      Email: ${to}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #999999; font-size: 14px;">
                Neu ban co bat ky cau hoi nao, vui long lien he voi chung toi.
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Generate plain text email content
 */
const generateRegistrationEmailText = ({ fullName, to, appName, loginUrl }) => {
  return `
Chao mung ${fullName}!

Cam on ban da dang ky tai khoan tai ${appName}. Tai khoan cua ban da duoc tao thanh cong!

Voi tai khoan nay, ban co the:
- Dat cho khong gian lam viec
- Quan ly lich dat cho cua ban
- Dat mon an va do uong
- Theo doi lich su thanh toan

Hay dang nhap ngay de bat dau trai nghiem dich vu cua chung toi!

Dang nhap tai: ${loginUrl}/login

Thong tin tai khoan:
Email: ${to}

Neu ban co bat ky cau hoi nao, vui long lien he voi chung toi.

${appName}
  `.trim();
};

/**
 * Send registration success email using Resend API
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.fullName - User's full name
 */
export const sendRegistrationEmail = async ({ to, fullName }) => {
  const resend = createResendClient();
  
  const appName = process.env.APP_NAME || "Coworking Space";
  const loginUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  // Resend requires a verified domain or use onboarding@resend.dev for testing
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

  const emailData = { fullName, to, appName, loginUrl };
  const htmlContent = generateRegistrationEmailHtml(emailData);
  const textContent = generateRegistrationEmailText(emailData);

  const subject = `Chao mung ban den voi ${appName} - Dang ky thanh cong!`;

  // If Resend is not configured, log the email content
  if (!resend) {
    console.log("=".repeat(60));
    console.log("EMAIL WOULD BE SENT (Resend API not configured):");
    console.log("From:", fromEmail);
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Content:", textContent);
    console.log("=".repeat(60));
    return { success: true, message: "Email logged (not sent - Resend API not configured)" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${appName} <${fromEmail}>`,
      to: [to],
      subject,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error("Resend API error:", error);
      return { success: false, error: error.message };
    }

    console.log("Registration email sent successfully via Resend:", data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("Failed to send registration email:", error);
    // Don't throw error - registration should still succeed even if email fails
    return { success: false, error: error.message };
  }
};

/**
 * Check if email service is configured
 */
export const isEmailConfigured = () => {
  return !!process.env.RESEND_API_KEY;
};

export default {
  sendRegistrationEmail,
  isEmailConfigured,
};

