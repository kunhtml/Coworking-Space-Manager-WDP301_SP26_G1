import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router";
import { animate, stagger } from "animejs";
import {
  registerApi,
  sendRegisterOtpApi,
  verifyRegisterOtpApi,
} from "../../services/api";
import { saveAuth } from "../../store/authSlice";
import GuestCustomerNavbar from "../../components/common/GuestCustomerNavbar";

const STRICT_EMAIL_REGEX =
  /^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*@[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)+$/;

export function meta() {
  return [
    { title: "Đăng ký | Coworking Space" },
    { name: "description", content: "Đăng ký tài khoản Coworking Space" },
  ];
}

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const isEmailFormatValid = STRICT_EMAIL_REGEX.test(
    email.trim().toLowerCase(),
  );

  useEffect(() => {
    animate(".register-card", {
      translateY: [50, 0],
      opacity: [0, 1],
      duration: 1000,
      easing: "easeOutExpo",
      delay: 200,
    });

    animate(".register-header-item", {
      translateY: [20, 0],
      opacity: [0, 1],
      duration: 800,
      easing: "easeOutExpo",
      delay: stagger(150, { start: 500 }),
    });

    animate(".register-form-item", {
      translateX: [-20, 0],
      opacity: [0, 1],
      duration: 800,
      easing: "easeOutExpo",
      delay: stagger(100, { start: 800 }),
    });
  }, []);

  const validateBasicForm = () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError("Vui lòng điền đầy đủ các trường bắt buộc.");
      return false;
    }

    if (!STRICT_EMAIL_REGEX.test(email.trim().toLowerCase())) {
      setError("Email không đúng định dạng.");
      return false;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return false;
    }

    if (!agreedTerms) {
      setError("Vui lòng đồng ý với điều khoản sử dụng.");
      return false;
    }

    return true;
  };

  const handleSendOtp = async () => {
    setError("");
    setSuccess("");

    if (!STRICT_EMAIL_REGEX.test(email.trim().toLowerCase())) {
      setError("Vui lòng nhập email hợp lệ trước khi gửi OTP.");
      return;
    }

    setOtpLoading(true);
    try {
      await sendRegisterOtpApi(email.trim().toLowerCase());
      setOtpSent(true);
      setOtpVerified(false);
      setOtpCode("");
      setSuccess("Đã gửi mã OTP qua email. Vui lòng kiểm tra hộp thư.");
    } catch (err) {
      setError(err.message || "Không thể gửi OTP. Vui lòng thử lại.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setSuccess("");

    if (!otpSent) {
      setError("Vui lòng gửi OTP trước.");
      return;
    }

    if (!STRICT_EMAIL_REGEX.test(email.trim().toLowerCase())) {
      setError("Email không đúng định dạng.");
      return;
    }

    if (!/^\d{6}$/.test(otpCode.trim())) {
      setError("OTP phải gồm 6 chữ số.");
      return;
    }

    setOtpLoading(true);
    try {
      await verifyRegisterOtpApi(email.trim().toLowerCase(), otpCode.trim());
      setOtpVerified(true);
      setSuccess("Xác thực OTP thành công. Bạn có thể đăng ký ngay.");
    } catch (err) {
      setOtpVerified(false);
      setError(err.message || "Xác thực OTP thất bại.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateBasicForm()) {
      return;
    }

    if (!otpVerified) {
      setError("Vui lòng gửi và xác thực OTP email trước khi đăng ký.");
      return;
    }

    setLoading(true);
    try {
      const response = await registerApi(
        fullName.trim(),
        email.trim().toLowerCase(),
        phone.trim() || null,
        password,
      );

      setSuccess("Đăng ký thành công! Đang chuyển hướng...");
      saveAuth(response.token, response.user);
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      {/* Header Navigation */}
      <GuestCustomerNavbar activeItem="home" />

      {/* Register Section */}
      <section className="flex-grow-1 d-flex align-items-center py-5">
        <Container>
          <Row className="justify-content-center">
            <Col lg={6} md={8}>
              <Card
                className="border-0 shadow-lg rounded-4 overflow-hidden register-card"
                style={{ opacity: 0 }}
              >
                <Card.Body className="p-5">
                  {/* Header */}
                  <div className="text-center mb-5">
                    <div
                      className="mb-4 register-header-item"
                      style={{ opacity: 0 }}
                    >
                      <i
                        className="bi bi-person-plus-fill"
                        style={{ fontSize: "2.5rem", color: "#6366f1" }}
                      ></i>
                    </div>
                    <h2
                      className="fw-bold mb-2 register-header-item"
                      style={{ opacity: 0, color: "#1f2937" }}
                    >
                      Đăng ký tài khoản
                    </h2>
                    <p
                      className="text-muted small register-header-item"
                      style={{ opacity: 0 }}
                    >
                      Tạo tài khoản mới để bắt đầu trải nghiệm.
                    </p>
                  </div>

                  {error && (
                    <Alert
                      variant="danger"
                      dismissible
                      onClose={() => setError("")}
                      className="py-2 small mb-4"
                    >
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {error}
                    </Alert>
                  )}
                  {success && (
                    <Alert variant="success" className="py-2 small mb-4">
                      <i className="bi bi-check-circle-fill me-2"></i>
                      {success}
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit}>
                    {/* Full Name */}
                    <Form.Group
                      className="mb-3 register-form-item"
                      style={{ opacity: 0 }}
                    >
                      <Form.Label
                        className="fw-bold mb-2"
                        style={{ color: "#1f2937" }}
                      >
                        Họ và tên <span style={{ color: "#ef4444" }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Nhập họ và tên"
                        className="py-2 px-3 rounded-3 border-2 focus-ring focus-ring-primary transition-all"
                        style={{
                          borderColor: "#e5e7eb",
                          color: "#1f2937",
                        }}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={loading}
                      />
                    </Form.Group>

                    {/* Email */}
                    <Form.Group
                      className="mb-3 register-form-item"
                      style={{ opacity: 0 }}
                    >
                      <Form.Label
                        className="fw-bold mb-2"
                        style={{ color: "#1f2937" }}
                      >
                        Email <span style={{ color: "#ef4444" }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Nhập email"
                        className="py-2 px-3 rounded-3 border-2 focus-ring focus-ring-primary transition-all"
                        style={{
                          borderColor: "#e5e7eb",
                          color: "#1f2937",
                        }}
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setOtpSent(false);
                          setOtpVerified(false);
                          setOtpCode("");
                        }}
                        disabled={loading || otpLoading}
                        isInvalid={
                          email.trim().length > 0 && !isEmailFormatValid
                        }
                      />
                      {email.trim().length > 0 && !isEmailFormatValid && (
                        <Form.Text className="text-danger">
                          Email không đúng định dạng.
                        </Form.Text>
                      )}

                      <div className="d-flex gap-2 mt-2">
                        <Button
                          type="button"
                          variant="outline-primary"
                          className="rounded-3"
                          onClick={handleSendOtp}
                          disabled={
                            loading || otpLoading || !isEmailFormatValid
                          }
                        >
                          {otpLoading
                            ? "Đang gửi..."
                            : otpSent
                              ? "Gửi lại OTP"
                              : "Gửi OTP"}
                        </Button>
                        {otpVerified && (
                          <span className="small text-success align-self-center fw-semibold">
                            Email đã xác thực OTP
                          </span>
                        )}
                      </div>
                    </Form.Group>

                    {otpSent && (
                      <Form.Group
                        className="mb-3 register-form-item"
                        style={{ opacity: 1 }}
                      >
                        <Form.Label
                          className="fw-bold mb-2"
                          style={{ color: "#1f2937" }}
                        >
                          Mã OTP email{" "}
                          <span style={{ color: "#ef4444" }}>*</span>
                        </Form.Label>
                        <div className="d-flex gap-2">
                          <Form.Control
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="Nhập mã OTP 6 số"
                            className="py-2 px-3 rounded-3 border-2 focus-ring focus-ring-primary transition-all"
                            style={{
                              borderColor: "#e5e7eb",
                              color: "#1f2937",
                            }}
                            value={otpCode}
                            onChange={(e) =>
                              setOtpCode(e.target.value.replace(/\D/g, ""))
                            }
                            disabled={loading || otpLoading || otpVerified}
                          />
                          <Button
                            type="button"
                            variant={
                              otpVerified ? "success" : "outline-success"
                            }
                            className="rounded-3"
                            onClick={handleVerifyOtp}
                            disabled={loading || otpLoading || otpVerified}
                          >
                            {otpVerified
                              ? "Đã xác thực"
                              : otpLoading
                                ? "Đang xác thực..."
                                : "Xác thực OTP"}
                          </Button>
                        </div>
                      </Form.Group>
                    )}

                    {/* Phone */}
                    <Form.Group
                      className="mb-3 register-form-item"
                      style={{ opacity: 0 }}
                    >
                      <Form.Label
                        className="fw-bold mb-2"
                        style={{ color: "#1f2937" }}
                      >
                        Số điện thoại
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        placeholder="Nhập số điện thoại (tùy chọn)"
                        className="py-2 px-3 rounded-3 border-2 focus-ring focus-ring-primary transition-all"
                        style={{
                          borderColor: "#e5e7eb",
                          color: "#1f2937",
                        }}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={loading}
                      />
                    </Form.Group>

                    {/* Password */}
                    <Form.Group
                      className="mb-3 register-form-item"
                      style={{ opacity: 0 }}
                    >
                      <Form.Label
                        className="fw-bold mb-2"
                        style={{ color: "#1f2937" }}
                      >
                        Mật khẩu <span style={{ color: "#ef4444" }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                        className="py-2 px-3 rounded-3 border-2 focus-ring focus-ring-primary transition-all"
                        style={{
                          borderColor: "#e5e7eb",
                          color: "#1f2937",
                        }}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                    </Form.Group>

                    {/* Confirm Password */}
                    <Form.Group
                      className="mb-3 register-form-item"
                      style={{ opacity: 0 }}
                    >
                      <Form.Label
                        className="fw-bold mb-2"
                        style={{ color: "#1f2937" }}
                      >
                        Xác nhận mật khẩu{" "}
                        <span style={{ color: "#ef4444" }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Nhập lại mật khẩu"
                        className="py-2 px-3 rounded-3 border-2 focus-ring focus-ring-primary transition-all"
                        style={{
                          borderColor: "#e5e7eb",
                          color: "#1f2937",
                        }}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                      />
                    </Form.Group>

                    {/* Terms & Conditions */}
                    <Form.Group
                      className="mb-4 register-form-item"
                      style={{ opacity: 0 }}
                    >
                      <Form.Check
                        type="checkbox"
                        label={
                          <span>
                            Tôi đồng ý với{" "}
                            <Link
                              to="#"
                              className="text-decoration-none fw-bold"
                              style={{ color: "#6366f1" }}
                            >
                              điều khoản sử dụng
                            </Link>{" "}
                            và{" "}
                            <Link
                              to="#"
                              className="text-decoration-none fw-bold"
                              style={{ color: "#6366f1" }}
                            >
                              chính sách bảo mật
                            </Link>
                          </span>
                        }
                        className="text-muted small"
                        checked={agreedTerms}
                        onChange={(e) => setAgreedTerms(e.target.checked)}
                        disabled={loading}
                      />
                    </Form.Group>

                    {/* Submit Button */}
                    <Button
                      variant="primary"
                      type="submit"
                      className="w-100 py-3 fw-bold mb-4 rounded-3 border-0 register-form-item transition-all d-flex align-items-center justify-content-center gap-2"
                      style={{ backgroundColor: "#6366f1", opacity: 0 }}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" />
                          Đang xử lý...
                        </>
                      ) : (
                        "Đăng ký"
                      )}
                    </Button>

                    {/* Login Link */}
                    <div
                      className="text-center register-form-item"
                      style={{ opacity: 0 }}
                    >
                      <p className="text-muted small mb-0">
                        Đã có tài khoản?{" "}
                        <Link
                          to="/login"
                          className="fw-bold text-decoration-none"
                          style={{ color: "#6366f1" }}
                        >
                          Đăng nhập
                        </Link>
                      </p>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
}
