import { Alert, Button, Col, Form, Modal, Row, Spinner } from "react-bootstrap";

export default function CategoryFormModal({
  show,
  onHide,
  title,
  onSubmit,
  loading,
  error,
  clearError,
  catForm,
  catErrors,
  setCatField,
  submitText,
  switchId,
  switchDescription,
}) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold">{title}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit} noValidate>
        <Modal.Body className="px-4">
          {error ? <Alert variant="danger" dismissible onClose={clearError} className="py-2">{error}</Alert> : null}
          <Row className="g-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold">Ten danh muc <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  value={catForm.name}
                  isInvalid={!!catErrors.name}
                  onChange={(e) => setCatField("name", e.target.value)}
                />
                {catErrors.name ? <Form.Text className="text-danger">{catErrors.name}</Form.Text> : null}
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold">Mo ta</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={catForm.description}
                  onChange={(e) => setCatField("description", e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group className="d-flex align-items-center gap-3 mt-1">
                <Form.Check
                  type="switch"
                  id={switchId}
                  checked={catForm.isActive}
                  onChange={(e) => setCatField("isActive", e.target.checked)}
                />
                <div>
                  <div className="fw-semibold" style={{ fontSize: 14 }}>{catForm.isActive ? "Dang hien thi" : "Tam an"}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{switchDescription}</div>
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={onHide} disabled={loading}>Huy</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? <Spinner size="sm" animation="border" className="me-1" /> : null}
            {submitText}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
