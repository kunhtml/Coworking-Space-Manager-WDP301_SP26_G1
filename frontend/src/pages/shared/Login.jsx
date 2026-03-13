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
import { loginApi } from "../services/api";
import { saveAuth } from "../store/authSlice";

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

    animate(".login-header-item", {
      translateY: [20, 0],
      opacity: [0, 1],
      duration: 800,
      easing: "easeOutExpo",
      delay: stagger(150, { start: 500 }),
    });

    animate(".login-form-item", {
      translateX: [-20, 0],
      opacity: [0, 1],
      duration: 800,
      easing: "easeOutExpo",
      delay: stagger(100, { start: 800 }),
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
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex flex-column min-vh-100 text-light font-monospace position-relative overflow-hidden"
      style={{
        backgroundImage: "url('/login-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay for readability */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          zIndex: 0,
          backgroundColor: "rgba(0,0,0,0.65)",
          pointerEvents: "none",
        }}
      />

      <Container
        className="flex-grow-1 d-flex align-items-center justify-content-center py-5 position-relative"
        style={{ zIndex: 1 }}
      >
        <Row className="w-100 justify-content-center">
          <Col md={8} lg={6} xl={5}>
            <Card
              className="bg-dark border-secondary shadow-lg text-light login-card"
              style={{ opacity: 0 }}
            >
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <Link
                    to="/"
                    className="text-decoration-none text-light d-inline-block mb-3 login-header-item"
                    style={{ opacity: 0 }}
                  >
                    <h2 className="fw-bold mb-0 d-flex align-items-center justify-content-center">
                      <i
                        className="bi bi-cup-hot-fill me-2"
                        style={{ color: "#d4a373" }}
                      ></i>
                      NEXUS COFFEE
                    </h2>
                  </Link>
                  <h4
                    className="text-uppercase letter-spacing-1 mb-2 login-header-item"
                    style={{ opacity: 0 }}
                  >
                    Đăng nhập
                  </h4>
                  <p
                    className="text-secondary small login-header-item"
                    style={{ opacity: 0 }}
                  >
                    Chào mừng bạn quay trở lại!
                  </p>
                </div>

                {error && (
                  <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setError("")}
                    className="py-2 small"
                  >
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert variant="success" className="py-2 small">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    {success}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group
                    className="mb-4 login-form-item"
                    controlId="formBasicEmail"
                    style={{ opacity: 0 }}
                  >
                    <Form.Label className="text-uppercase small fw-bold text-secondary">
                      Email / Số điện thoại
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Nhập email hoặc số điện thoại"
                      className="bg-dark text-light border-secondary py-2 px-3 shadow-none focus-ring focus-ring-primary transition-all"
                      style={{ backgroundColor: "#212529" }}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      disabled={loading}
                    />
                  </Form.Group>

                  <Form.Group
                    className="mb-4 login-form-item"
                    controlId="formBasicPassword"
                    style={{ opacity: 0 }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <Form.Label className="text-uppercase small fw-bold text-secondary mb-0">
                        Mật khẩu
                      </Form.Label>
                      <Link
                        to="/forgot-password"
                        className="text-primary text-decoration-none small hover-primary transition-all"
                      >
                        Quên mật khẩu?
                      </Link>
                    </div>
                    <Form.Control
                      type="password"
                      placeholder="Nhập mật khẩu"
                      className="bg-dark text-light border-secondary py-2 px-3 shadow-none focus-ring focus-ring-primary transition-all"
                      style={{ backgroundColor: "#212529" }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                  </Form.Group>

                  <Form.Group
                    className="mb-4 login-form-item"
                    controlId="formBasicCheckbox"
                    style={{ opacity: 0 }}
                  >
                    <Form.Check
                      type="checkbox"
                      label="Ghi nhớ đăng nhập"
                      className="text-secondary small"
                    />
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 py-2 fw-bold text-uppercase mb-4 rounded-0 border-0 login-form-item transition-all hover-scale d-flex align-items-center justify-content-center gap-2"
                    style={{ backgroundColor: "#d4a373", opacity: 0 }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" />
                        Đang đăng nhập...
                      </>
                    ) : (
                      "Đăng nhập"
                    )}
                  </Button>

                  <div
                    className="text-center login-form-item"
                    style={{ opacity: 0 }}
                  >
                    <p className="text-secondary small mb-0">
                      Chưa có tài khoản?{" "}
                      <Link
                        to="/register"
                        className="text-primary text-decoration-none fw-bold hover-primary transition-all"
                      >
                        Đăng ký ngay
                      </Link>
                    </p>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
