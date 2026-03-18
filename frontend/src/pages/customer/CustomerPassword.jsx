import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Navbar,
  Row,
  Spinner,
} from "react-bootstrap";
import { Link, Navigate } from "react-router";
import AuthNavActions from "../../components/common/AuthNavActions";
import { changePasswordApi } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

export function meta() {
  return [{ title: "Đổi mật khẩu | Customer" }];
}

export default function CustomerPassword() {
  const { isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const onChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (message.text) setMessage({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: "danger", text: "Xác nhận mật khẩu không khớp." });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({
        type: "danger",
        text: "Mật khẩu mới phải có ít nhất 6 ký tự.",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await changePasswordApi({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      setMessage({
        type: "success",
        text: res?.message || "Đổi mật khẩu thành công.",
      });
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setMessage({
        type: "danger",
        text: error.message || "Đổi mật khẩu thất bại.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
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
          <div className="d-flex gap-3 align-items-center">
            <AuthNavActions />
          </div>
        </Container>
      </Navbar>

      <main className="py-5 flex-grow-1">
        <Container>
          <Row className="justify-content-center">
            <Col lg={8}>
              <Card className="border-0 shadow-sm rounded-4">
                <Card.Header className="bg-white border-bottom py-3 px-4">
                  <h5 className="fw-bold mb-0">
                    <i className="bi bi-key-fill me-2 text-primary"></i>
                    Đổi mật khẩu
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  {message.text && (
                    <Alert
                      variant={message.type}
                      dismissible
                      onClose={() => setMessage({ type: "", text: "" })}
                    >
                      {message.text}
                    </Alert>
                  )}
                  <Form onSubmit={handleSubmit}>
                    <Row className="g-3">
                      <Col md={12}>
                        <Form.Label className="fw-semibold">
                          Mật khẩu hiện tại
                        </Form.Label>
                        <Form.Control
                          type="password"
                          value={formData.currentPassword}
                          onChange={(e) =>
                            onChange("currentPassword", e.target.value)
                          }
                          required
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Label className="fw-semibold">
                          Mật khẩu mới
                        </Form.Label>
                        <Form.Control
                          type="password"
                          value={formData.newPassword}
                          onChange={(e) =>
                            onChange("newPassword", e.target.value)
                          }
                          required
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Label className="fw-semibold">
                          Xác nhận mật khẩu mới
                        </Form.Label>
                        <Form.Control
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            onChange("confirmPassword", e.target.value)
                          }
                          required
                        />
                      </Col>
                    </Row>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                      <Button
                        as={Link}
                        to="/customer-dashboard/profile"
                        variant="outline-secondary"
                      >
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Spinner
                              animation="border"
                              size="sm"
                              className="me-2"
                            />
                            Đang cập nhật...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-lg me-2"></i>
                            Cập nhật mật khẩu
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </main>
    </div>
  );
}
