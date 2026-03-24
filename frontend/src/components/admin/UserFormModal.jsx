import { Alert, Button, Col, Form, Modal, Row, Spinner } from "react-bootstrap";

function FieldGroup({ label, required, error, children }) {
  return (
    <Form.Group>
      <Form.Label className="fw-semibold">
        {label} {required ? <span className="text-danger">*</span> : null}
      </Form.Label>
      {children}
      {error ? <Form.Text className="text-danger">{error}</Form.Text> : null}
    </Form.Group>
  );
}

export default function UserFormModal({
  show,
  onHide,
  onSubmit,
  formData,
  fieldErrors,
  formLoading,
  error,
  clearError,
  title,
  submitText,
  mode,
  onField,
  onClearFieldError,
}) {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold">{title}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit} noValidate>
        <Modal.Body className="px-4">
          {error ? (
            <Alert variant="danger" dismissible onClose={clearError} className="py-2">
              {error}
            </Alert>
          ) : null}

          <Row className="g-3">
            <Col md={6}>
              <FieldGroup label="Ho va ten" required error={fieldErrors.fullName}>
                <Form.Control
                  type="text"
                  value={formData.fullName}
                  isInvalid={!!fieldErrors.fullName}
                  onChange={(e) => {
                    onField("fullName", e.target.value);
                    onClearFieldError("fullName");
                  }}
                />
              </FieldGroup>
            </Col>
            <Col md={6}>
              <FieldGroup label="Email" required error={fieldErrors.email}>
                <Form.Control
                  type="email"
                  value={formData.email}
                  isInvalid={!!fieldErrors.email}
                  onChange={(e) => {
                    onField("email", e.target.value);
                    onClearFieldError("email");
                  }}
                />
              </FieldGroup>
            </Col>

            {mode === "add" ? (
              <>
                <Col md={6}>
                  <FieldGroup label="Mat khau" required error={fieldErrors.password}>
                    <Form.Control
                      type="password"
                      value={formData.password}
                      isInvalid={!!fieldErrors.password}
                      onChange={(e) => {
                        onField("password", e.target.value);
                        onClearFieldError("password");
                      }}
                      autoComplete="new-password"
                    />
                  </FieldGroup>
                </Col>
                <Col md={6}>
                  <FieldGroup label="Xac nhan mat khau" required error={fieldErrors.confirmPassword}>
                    <Form.Control
                      type="password"
                      value={formData.confirmPassword}
                      isInvalid={!!fieldErrors.confirmPassword}
                      onChange={(e) => {
                        onField("confirmPassword", e.target.value);
                        onClearFieldError("confirmPassword");
                      }}
                      autoComplete="new-password"
                    />
                  </FieldGroup>
                </Col>
              </>
            ) : null}

            <Col md={mode === "add" ? 6 : 12}>
              <FieldGroup label="So dien thoai" error={fieldErrors.phone}>
                <Form.Control
                  type="tel"
                  value={formData.phone}
                  isInvalid={!!fieldErrors.phone}
                  onChange={(e) => {
                    onField("phone", e.target.value);
                    onClearFieldError("phone");
                  }}
                />
              </FieldGroup>
            </Col>
            <Col md={6}>
              <FieldGroup label="Vai tro">
                <Form.Select value={formData.role} onChange={(e) => onField("role", e.target.value)}>
                  <option value="Customer">Khach hang</option>
                  <option value="Staff">Nhan vien</option>
                  <option value="Admin">Quan tri vien</option>
                </Form.Select>
              </FieldGroup>
            </Col>
            <Col md={6}>
              <FieldGroup label="Trang thai">
                <Form.Select value={formData.membershipStatus} onChange={(e) => onField("membershipStatus", e.target.value)}>
                  <option value="Active">Hoat dong</option>
                  <option value="Suspended">Tam khoa</option>
                </Form.Select>
              </FieldGroup>
            </Col>
          </Row>

          {mode === "edit" ? (
            <Alert variant="info" className="mt-3 mb-0 py-2">
              De thay doi mat khau, nguoi dung can dung chuc nang doi mat khau trong ho so cua ho.
            </Alert>
          ) : null}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={onHide} disabled={formLoading}>Huy</Button>
          <Button variant={mode === "add" ? "success" : "primary"} type="submit" disabled={formLoading}>
            {formLoading ? <Spinner size="sm" animation="border" className="me-1" /> : null}
            {submitText}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
