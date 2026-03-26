import { Alert, Button, Card, Container, Form } from "react-bootstrap";
import { Link } from "react-router";
import { useEffect, useState } from "react";
import {
  sendForgotPasswordOtpApi,
  verifyForgotPasswordOtpApi,
  resetForgotPasswordApi,
} from "../../services/api";

const STRICT_EMAIL_REGEX =
  /^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*@[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)+$/;

export function meta() {
  return [
    { title: "Quên mật khẩu | Coworking Space" },
    {
      name: "description",
      content:
        "Trang hướng dẫn khôi phục mật khẩu cho tài khoản Coworking Space.",
    },
  ];
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState("send-otp");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);
  const isEmailFormatValid = STRICT_EMAIL_REGEX.test(
    email.trim().toLowerCase(),
  );

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const requestOtp = async () => {
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Vui lòng nhập email.");
      return false;
    }
    if (!STRICT_EMAIL_REGEX.test(email.trim().toLowerCase())) {
      setError("Email không đúng định dạng.");
      return false;
    }

    try {
      setLoading(true);
      const res = await sendForgotPasswordOtpApi(email.trim());
      setSuccess(res?.message || "Đã gửi OTP đến email (nếu email tồn tại).");
      setStep("verify-otp");
      setOtpCooldown(60);
      return true;
    } catch (err) {
      setError(err.message || "Gửi OTP thất bại.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    await requestOtp();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!/^\d{6}$/.test(otp.trim())) {
      setError("OTP phải gồm 6 chữ số.");
      return;
    }
    if (!STRICT_EMAIL_REGEX.test(email.trim().toLowerCase())) {
      setError("Email không đúng định dạng.");
      return;
    }

    try {
      setLoading(true);
      const res = await verifyForgotPasswordOtpApi(email.trim(), otp.trim());
      setSuccess(res?.message || "Xác minh OTP thành công.");
      setStep("reset-password");
    } catch (err) {
      setError(err.message || "Xác minh OTP thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (!STRICT_EMAIL_REGEX.test(email.trim().toLowerCase())) {
      setError("Email không đúng định dạng.");
      return;
    }

    try {
      setLoading(true);
      const res = await resetForgotPasswordApi(
        email.trim(),
        newPassword,
        confirmPassword,
      );
      setSuccess(res?.message || "Đặt lại mật khẩu thành công.");
      setStep("done");
    } catch (err) {
      setError(err.message || "Đặt lại mật khẩu thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <Container style={{ maxWidth: 520 }}>
        <Card className="shadow-sm border-0 rounded-4">
          <Card.Body className="p-4 p-md-5">
            <h3 className="fw-bold mb-2">Quên mật khẩu</h3>
            <p className="text-muted mb-4">
              Nhập email để nhận OTP, xác minh và đặt lại mật khẩu.
            </p>

            {error ? (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            ) : null}
            {success ? (
              <Alert variant="success" className="mb-3">
                {success}
              </Alert>
            ) : null}

            <Form
              onSubmit={
                step === "send-otp"
                  ? handleSendOtp
                  : step === "verify-otp"
                    ? handleVerifyOtp
                    : step === "reset-password"
                      ? handleResetPassword
                      : (e) => e.preventDefault()
              }
            >
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={step !== "send-otp"}
                  required
                  isInvalid={email.trim().length > 0 && !isEmailFormatValid}
                />
                {email.trim().length > 0 && !isEmailFormatValid ? (
                  <Form.Text className="text-danger">
                    Email không đúng định dạng.
                  </Form.Text>
                ) : null}
              </Form.Group>

              {step === "verify-otp" ? (
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Mã OTP</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nhập 6 chữ số"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    required
                  />
                </Form.Group>
              ) : null}

              {step === "reset-password" ? (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Mật khẩu mới
                    </Form.Label>
                    <Form.Control
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Xác nhận mật khẩu
                    </Form.Label>
                    <Form.Control
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </Form.Group>
                </>
              ) : null}

              {step !== "done" ? (
                <Button
                  type="submit"
                  className="w-100 mb-3"
                  disabled={
                    loading ||
                    (step === "send-otp" && (otpCooldown > 0 || !isEmailFormatValid))
                  }
                >
                  {step === "send-otp"
                    ? otpCooldown > 0
                      ? `Gửi OTP (${otpCooldown}s)`
                      : "Gửi OTP"
                    : step === "verify-otp"
                      ? "Xác minh OTP"
                      : "Đặt lại mật khẩu"}
                </Button>
              ) : null}

              {step === "verify-otp" ? (
                <Button
                  type="button"
                  variant="outline-secondary"
                  className="w-100 mb-3"
                  onClick={requestOtp}
                  disabled={loading || otpCooldown > 0}
                >
                  {otpCooldown > 0
                    ? `Gửi lại OTP sau ${otpCooldown}s`
                    : "Gửi lại OTP"}
                </Button>
              ) : null}
            </Form>

            <div className="text-center">
              <Link to="/login" className="text-decoration-none">
                Quay lại đăng nhập
              </Link>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
