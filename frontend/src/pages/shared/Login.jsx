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
  InputGroup,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router";
import { animate } from "animejs";
import { loginApi } from "../../services/api";
import { saveAuth } from "../../store/authSlice";

export function meta() {
  return [
    { title: "Đăng nhập | Nexus Coffee" },
    { name: "description", content: "Đăng nhập vào hệ thống Nexus Coffee" },
  ];
}

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    animate(".login-card", {
      translateY: [50, 0],
      opacity: [0, 1],
      duration: 1000,
      easing: "easeOutExpo",
      delay: 200,
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!identifier.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ email/số điện thoại và mật khẩu.");
      return;
    }

    setLoading(true);
    try {
      const data = await loginApi(identifier, password);
      saveAuth(data.token, data.user);
      setSuccess(`Chào mừng ${data.user.fullName}! Đang chuyển hướng...`);
      const redirectPath =
        data.user?.role === "Admin"
          ? "/admin-dashboard"
          : data.user?.role === "Staff"
            ? "/staff-dashboard"
            : data.user?.role === "Customer"
              ? "/customer-dashboard"
              : "/";
      setTimeout(() => navigate(redirectPath), 1500);
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-circle-1"></div>
      <div className="login-circle-2"></div>

      <Card className="login-card bg-white" style={{ opacity: 0 }}>
        <Card.Body className="p-0">
          <div className="text-center px-4 pt-4 pb-3">
            <div
              className="mx-auto rounded-3 d-flex align-items-center justify-content-center mb-3"
              style={{
                width: "64px",
                height: "64px",
                background: "#6366f1",
                color: "white",
                fontSize: "1.75rem",
              }}
            >
              <i className="bi bi-cup-hot-fill"></i>
            </div>
            <h2
              className="fw-bold mb-0"
              style={{ color: "#2b2b2b", fontSize: "1.5rem" }}
            >
              Study<span style={{ color: "#a78bfa" }}>Space</span>
            </h2>
            <p
              className="text-muted small mb-2"
              style={{ fontSize: "0.85rem" }}
            >
              Coworking Space Management System
            </p>
            <Link
              to="/"
              className="btn btn-sm fw-bold rounded-pill px-3 py-2"
              style={{
                background: "linear-gradient(135deg, #c94caf, #d96cc5)",
                color: "white",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              <i className="bi bi-house-fill me-2"></i> Trang chủ
            </Link>
          </div>

          <div className="px-4 py-4">
            {error && (
              <Alert
                variant="danger"
                dismissible
                onClose={() => setError("")}
                className="py-2 small mb-3"
              >
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success" className="py-2 small mb-3">
                <i className="bi bi-check-circle-fill me-2"></i>
                {success}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label
                  className="small fw-bold text-dark mb-2"
                  style={{ fontSize: "0.9rem" }}
                >
                  Tên đăng nhập
                </Form.Label>
                <InputGroup className="login-input-group">
                  <InputGroup.Text
                    style={{ background: "transparent", border: "none" }}
                  >
                    <i
                      className="bi bi-person-fill"
                      style={{ color: "#a0a0a0" }}
                    ></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="admin"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={loading}
                    autoComplete="username"
                    style={{
                      background: "#f5f5f5",
                      border: "none",
                      fontSize: "0.95rem",
                    }}
                  />
                </InputGroup>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label
                  className="small fw-bold text-dark mb-2"
                  style={{ fontSize: "0.9rem" }}
                >
                  Mật khẩu
                </Form.Label>
                <InputGroup className="login-input-group">
                  <InputGroup.Text
                    style={{ background: "transparent", border: "none" }}
                  >
                    <i
                      className="bi bi-lock-fill"
                      style={{ color: "#a0a0a0" }}
                    ></i>
                  </InputGroup.Text>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    placeholder="admin123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="current-password"
                    style={{
                      background: "#f5f5f5",
                      border: "none",
                      fontSize: "0.95rem",
                    }}
                  />
                  <Button
                    variant="link"
                    className="text-muted text-decoration-none"
                    style={{
                      border: "none",
                      background: "transparent",
                      pointerEvents: "auto",
                      color: "#a0a0a0",
                    }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i
                      className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}
                    ></i>
                  </Button>
                </InputGroup>
              </Form.Group>

              <div className="d-flex justify-content-between align-items-center mb-4">
                <Form.Check
                  type="checkbox"
                  label={<span style={{ fontSize: "0.85rem" }}>Ghi nhớ</span>}
                  className="text-muted"
                />
                <Link
                  to="/forgot-password"
                  className="small text-decoration-none"
                  style={{ color: "#a78bfa", fontSize: "0.85rem" }}
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-100 fw-bold mb-3 rounded-2"
                style={{
                  background: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
                  border: "none",
                  padding: "0.7rem",
                  fontSize: "0.95rem",
                  color: "white",
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Đăng Nhập
                  </>
                )}
              </Button>
            </Form>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
