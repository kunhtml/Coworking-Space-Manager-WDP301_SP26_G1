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
// Giả sử bạn có hàm registerApi trong file api.js, nếu chưa có thì mình sẽ hướng dẫn tạo sau nhé
import { registerApi } from "../../services/api"; 

export function meta() {
  return [
    { title: "Đăng ký | Nexus Coffee" },
    { name: "description", content: "Đăng ký tài khoản Nexus Coffee" },
  ];
}

export default function Register() {
  const navigate = useNavigate();
  
  // State cho các trường đăng ký
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Animation tương tự màn hình Login
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation cơ bản
    if (!formData.fullName || !formData.email || !formData.phone || !formData.password) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      // Gửi dữ liệu xuống backend (loại bỏ confirmPassword vì backend không cần)
      const { confirmPassword, ...dataToSubmit } = formData;
      await registerApi(dataToSubmit); 
      
      setSuccess("Đăng ký thành công! Đang chuyển hướng đến đăng nhập...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message || "Đăng ký thất bại, email hoặc số điện thoại có thể đã tồn tại.");
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
              className="bg-dark border-secondary shadow-lg text-light register-card"
              style={{ opacity: 0 }}
            >
              <Card.Body className="p-4 p-sm-5">
                <div className="text-center mb-4">
                  <Link
                    to="/"
                    className="text-decoration-none text-light d-inline-block mb-3 register-header-item"
                    style={{ opacity: 0 }}
                  >
                    <h2 className="fw-bold mb-0 d-flex align-items-center justify-content-center">
                      <i className="bi bi-cup-hot-fill me-2" style={{ color: "#d4a373" }}></i>
                      NEXUS COFFEE
                    </h2>
                  </Link>
                  <h4 className="text-uppercase letter-spacing-1 mb-2 register-header-item" style={{ opacity: 0 }}>
                    Đăng ký tài khoản
                  </h4>
                  <p className="text-secondary small register-header-item" style={{ opacity: 0 }}>
                    Trở thành thành viên để nhận nhiều ưu đãi!
                  </p>
                </div>

                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError("")} className="py-2 small">
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
                  <Form.Group className="mb-3 register-form-item" style={{ opacity: 0 }}>
                    <Form.Label className="text-uppercase small fw-bold text-secondary">
                      Họ và tên
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="fullName"
                      placeholder="Nhập họ và tên của bạn"
                      className="bg-dark text-light border-secondary py-2 px-3 shadow-none focus-ring focus-ring-primary transition-all"
                      style={{ backgroundColor: "#212529" }}
                      value={formData.fullName}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3 register-form-item" style={{ opacity: 0 }}>
                    <Form.Label className="text-uppercase small fw-bold text-secondary">
                      Email
                    </Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="Nhập địa chỉ email"
                      className="bg-dark text-light border-secondary py-2 px-3 shadow-none focus-ring focus-ring-primary transition-all"
                      style={{ backgroundColor: "#212529" }}
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3 register-form-item" style={{ opacity: 0 }}>
                    <Form.Label className="text-uppercase small fw-bold text-secondary">
                      Số điện thoại
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="phone"
                      placeholder="Nhập số điện thoại"
                      className="bg-dark text-light border-secondary py-2 px-3 shadow-none focus-ring focus-ring-primary transition-all"
                      style={{ backgroundColor: "#212529" }}
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3 register-form-item" style={{ opacity: 0 }}>
                    <Form.Label className="text-uppercase small fw-bold text-secondary">
                      Mật khẩu
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="Nhập mật khẩu"
                      className="bg-dark text-light border-secondary py-2 px-3 shadow-none focus-ring focus-ring-primary transition-all"
                      style={{ backgroundColor: "#212529" }}
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4 register-form-item" style={{ opacity: 0 }}>
                    <Form.Label className="text-uppercase small fw-bold text-secondary">
                      Xác nhận mật khẩu
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      placeholder="Nhập lại mật khẩu"
                      className="bg-dark text-light border-secondary py-2 px-3 shadow-none focus-ring focus-ring-primary transition-all"
                      style={{ backgroundColor: "#212529" }}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 py-2 fw-bold text-uppercase mb-4 rounded-0 border-0 register-form-item transition-all hover-scale d-flex align-items-center justify-content-center gap-2"
                    style={{ backgroundColor: "#d4a373", opacity: 0 }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" />
                        Đang đăng ký...
                      </>
                    ) : (
                      "Đăng ký"
                    )}
                  </Button>

                  <div className="text-center register-form-item" style={{ opacity: 0 }}>
                    <p className="text-secondary small mb-0">
                      Đã có tài khoản?{" "}
                      <Link
                        to="/login"
                        className="text-primary text-decoration-none fw-bold hover-primary transition-all"
                      >
                        Đăng nhập ngay
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