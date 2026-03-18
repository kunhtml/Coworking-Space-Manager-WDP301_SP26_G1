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
  Navbar,
  Nav,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router";
import { animate, stagger } from "animejs";
import { loginApi } from "../../services/api";
import { saveAuth } from "../../store/authSlice";
import AuthNavActions from "../../components/common/AuthNavActions";

export function meta() {
  return [
    { title: "Đăng nhập | StudySpace" },
    { name: "description", content: "Đăng nhập vào hệ thống StudySpace" },
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
    <div className="min-vh-100 bg-light d-flex flex-column">
      {/* Header Navigation */}
      <Navbar bg="white" expand="lg" className="py-3 shadow-sm border-0">
        <Container>
          <Navbar.Brand
            as={Link}
            to="/"
            className="fw-bold d-flex align-items-center"
          >
            <div
              className="studyspace-logo me-2 d-flex align-items-center justify-content-center rounded-3"
              style={{ background: "#6366f1", width: "40px", height: "40px" }}
            >
              <i className="bi bi-cup-hot-fill text-white"></i>
            </div>
            <span style={{ color: "#1f2937" }}>StudySpace</span>
          </Navbar.Brand>

          <Navbar.Toggle />
          <Navbar.Collapse>
            <Nav className="me-auto ms-5">
              <Nav.Link as={Link} to="/" className="fw-medium text-muted px-3">
                Trang chủ
              </Nav.Link>
              <Nav.Link href="#spaces" className="fw-medium text-muted px-3">
                Đặt chỗ
              </Nav.Link>
              <Nav.Link href="#menu" className="fw-medium text-muted px-3">
                Thực đơn
              </Nav.Link>
            </Nav>

            <div className="d-flex gap-3 align-items-center">
              <AuthNavActions />
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Login Section */}
      <section className="flex-grow-1 d-flex align-items-center py-5">
        <Container>
          <Row className="justify-content-center">
            <Col lg={6} md={8}>
              <Card
                className="border-0 shadow-lg rounded-4 overflow-hidden login-card"
                style={{ opacity: 0 }}
              >
                <Card.Body className="p-5">
                  {/* Header */}
                  <div className="text-center mb-5">
                    <div
                      className="mb-4 login-header-item"
                      style={{ opacity: 0 }}
                    >
                      <i
                        className="bi bi-cup-hot-fill"
                        style={{ fontSize: "2.5rem", color: "#6366f1" }}
                      ></i>
                    </div>
                    <h2
                      className="fw-bold mb-2 login-header-item"
                      style={{ opacity: 0, color: "#1f2937" }}
                    >
                      Đăng nhập
                    </h2>
                    <p
                      className="text-muted small login-header-item"
                      style={{ opacity: 0 }}
                    >
                      Chào mừng bạn quay trở lại. Đăng nhập để tiếp tục.
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
                    {/* Email/Phone */}
                    <Form.Group
                      className="mb-4 login-form-item"
                      style={{ opacity: 0 }}
                    >
                      <Form.Label
                        className="fw-bold mb-2"
                        style={{ color: "#1f2937" }}
                      >
                        Email hoặc Số điện thoại
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Nhập email hoặc số điện thoại"
                        className="py-3 px-3 rounded-3 border-2 focus-ring focus-ring-primary transition-all"
                        style={{
                          borderColor: "#e5e7eb",
                          color: "#1f2937",
                        }}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        disabled={loading}
                      />
                    </Form.Group>

                    {/* Password */}
                    <Form.Group
                      className="mb-4 login-form-item"
                      style={{ opacity: 0 }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <Form.Label
                          className="fw-bold mb-0"
                          style={{ color: "#1f2937" }}
                        >
                          Mật khẩu
                        </Form.Label>
                        <Link
                          to="/forgot-password"
                          className="text-primary text-decoration-none small fw-medium"
                          style={{ color: "#6366f1" }}
                        >
                          Quên mật khẩu?
                        </Link>
                      </div>
                      <Form.Control
                        type="password"
                        placeholder="Nhập mật khẩu"
                        className="py-3 px-3 rounded-3 border-2 focus-ring focus-ring-primary transition-all"
                        style={{
                          borderColor: "#e5e7eb",
                          color: "#1f2937",
                        }}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                    </Form.Group>

                    {/* Remember Me */}
                    <Form.Group
                      className="mb-4 login-form-item"
                      style={{ opacity: 0 }}
                    >
                      <Form.Check
                        type="checkbox"
                        label="Ghi nhớ đăng nhập"
                        className="text-muted small"
                      />
                    </Form.Group>

                    {/* Submit Button */}
                    <Button
                      variant="primary"
                      type="submit"
                      className="w-100 py-3 fw-bold mb-4 rounded-3 border-0 login-form-item transition-all d-flex align-items-center justify-content-center gap-2"
                      style={{ backgroundColor: "#6366f1", opacity: 0 }}
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

                    {/* Sign Up Link */}
                    <div
                      className="text-center login-form-item"
                      style={{ opacity: 0 }}
                    >
                      <p className="text-muted small mb-0">
                        Chưa có tài khoản?{" "}
                        <Link
                          to="/register"
                          className="fw-bold text-decoration-none"
                          style={{ color: "#6366f1" }}
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
      </section>
    </div>
  );
}
