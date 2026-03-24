import { Alert, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";

export default function AdminPasswordFormCard({
  passwordMessage,
  setPasswordMessage,
  handleChangePassword,
  passwordForm,
  onPasswordChange,
  passwordLoading,
}) {
  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white border-0 pb-0">
        <h5 className="mb-0 fw-semibold"><i className="bi bi-key-fill text-primary me-2"></i>Doi mat khau</h5>
      </Card.Header>
      <Card.Body className="pt-4">
        {passwordMessage.content ? (
          <Alert variant={passwordMessage.type} dismissible onClose={() => setPasswordMessage({ type: "", content: "" })}>
            {passwordMessage.content}
          </Alert>
        ) : null}

        <Form onSubmit={handleChangePassword}>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold">Mat khau hien tai</Form.Label>
                <Form.Control
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => onPasswordChange("currentPassword", e.target.value)}
                  required
                  disabled={passwordLoading}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold">Mat khau moi</Form.Label>
                <Form.Control
                  type="password"
                  value={passwordForm.newPassword}
                  minLength={6}
                  onChange={(e) => onPasswordChange("newPassword", e.target.value)}
                  required
                  disabled={passwordLoading}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold">Xac nhan mat khau moi</Form.Label>
                <Form.Control
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => onPasswordChange("confirmPassword", e.target.value)}
                  required
                  disabled={passwordLoading}
                  className={passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword ? "is-invalid" : ""}
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end mt-3">
            <Button type="submit" variant="primary" disabled={passwordLoading}>
              {passwordLoading ? (
                <><Spinner animation="border" size="sm" className="me-2" />Dang cap nhat...</>
              ) : (
                <><i className="bi bi-check-lg me-2"></i>Cap nhat mat khau</>
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
