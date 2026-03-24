import { Alert, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import { Link } from "react-router";

export default function PasswordChangeFormCard({
  message,
  clearMessage,
  formData,
  onChange,
  onSubmit,
  loading,
}) {
  return (
    <Card className="border-0 shadow-sm rounded-4">
      <Card.Header className="bg-white border-bottom py-3 px-4">
        <h5 className="fw-bold mb-0">
          <i className="bi bi-key-fill me-2 text-primary"></i>
          Đổi mật khẩu
        </h5>
      </Card.Header>
      <Card.Body className="p-4">
        {message.text ? (
          <Alert variant={message.type} dismissible onClose={clearMessage}>
            {message.text}
          </Alert>
        ) : null}
        <Form onSubmit={onSubmit}>
          <Row className="g-3">
            <Col md={12}>
              <Form.Label className="fw-semibold">Mật khẩu hiện tại</Form.Label>
              <Form.Control
                type="password"
                value={formData.currentPassword}
                onChange={(e) => onChange("currentPassword", e.target.value)}
                required
              />
            </Col>
            <Col md={6}>
              <Form.Label className="fw-semibold">Mật khẩu mới</Form.Label>
              <Form.Control
                type="password"
                value={formData.newPassword}
                onChange={(e) => onChange("newPassword", e.target.value)}
                required
              />
            </Col>
            <Col md={6}>
              <Form.Label className="fw-semibold">Xác nhận mật khẩu mới</Form.Label>
              <Form.Control
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => onChange("confirmPassword", e.target.value)}
                required
              />
            </Col>
          </Row>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button as={Link} to="/customer-dashboard/profile" variant="outline-secondary">
              Hủy
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
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
  );
}
