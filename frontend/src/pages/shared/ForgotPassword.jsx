import { Alert, Button, Card, Container, Form } from "react-bootstrap";
import { Link } from "react-router";
import { useState } from "react";

export function meta() {
  return [
    { title: "Quên mật khẩu | Coworking Space" },
    {
      name: "description",
      content: "Trang hướng dẫn khôi phục mật khẩu cho tài khoản Coworking Space.",
    },
  ];
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <Container style={{ maxWidth: 520 }}>
        <Card className="shadow-sm border-0 rounded-4">
          <Card.Body className="p-4 p-md-5">
            <h3 className="fw-bold mb-2">Quên mật khẩu</h3>
            <p className="text-muted mb-4">
              Nhập email tài khoản để nhận hướng dẫn đặt lại mật khẩu.
            </p>

            {submitted ? (
              <Alert variant="info" className="mb-4">
                Chức năng khôi phục mật khẩu qua email đang được hoàn thiện. Vui
                lòng liên hệ quản trị viên để được hỗ trợ đặt lại mật khẩu.
              </Alert>
            ) : null}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>

              <Button type="submit" className="w-100 mb-3">
                Gửi yêu cầu khôi phục
              </Button>
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
