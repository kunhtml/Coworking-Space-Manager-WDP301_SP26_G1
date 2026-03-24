import { Alert, Button, Col, Form, InputGroup, Modal, Row, Spinner } from "react-bootstrap";

export default function ServiceFormModal({
  show,
  onHide,
  title,
  onSubmit,
  loading,
  error,
  clearError,
  itemForm,
  itemErrors,
  setItemField,
  categories,
  statusOptions,
  submitText,
  includeInactiveCategories = false,
}) {
  const cats = includeInactiveCategories ? categories : categories.filter((c) => c.isActive !== false);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold">{title}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit} noValidate>
        <Modal.Body className="px-4">
          {error ? <Alert variant="danger" dismissible onClose={clearError} className="py-2">{error}</Alert> : null}
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Ten mon <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" value={itemForm.name} isInvalid={!!itemErrors.name} onChange={(e) => setItemField("name", e.target.value)} />
                {itemErrors.name ? <Form.Text className="text-danger">{itemErrors.name}</Form.Text> : null}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Danh muc</Form.Label>
                <Form.Select value={itemForm.categoryId} onChange={(e) => setItemField("categoryId", e.target.value)}>
                  <option value="">-- Khong co danh muc --</option>
                  {cats.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}{includeInactiveCategories && c.isActive === false ? " (dang an)" : ""}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold">Mo ta</Form.Label>
                <Form.Control as="textarea" rows={2} value={itemForm.description} onChange={(e) => setItemField("description", e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold">Gia (VND) <span className="text-danger">*</span></Form.Label>
                <InputGroup>
                  <Form.Control type="number" min={0} value={itemForm.price} isInvalid={!!itemErrors.price} onChange={(e) => setItemField("price", e.target.value)} />
                  <InputGroup.Text>₫</InputGroup.Text>
                </InputGroup>
                {itemErrors.price ? <Form.Text className="text-danger">{itemErrors.price}</Form.Text> : null}
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold">So luong ton kho</Form.Label>
                <Form.Control type="number" min={0} value={itemForm.stockQuantity} isInvalid={!!itemErrors.stockQuantity} onChange={(e) => setItemField("stockQuantity", e.target.value)} />
                {itemErrors.stockQuantity ? <Form.Text className="text-danger">{itemErrors.stockQuantity}</Form.Text> : null}
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold">Trang thai</Form.Label>
                <Form.Select value={itemForm.availabilityStatus} onChange={(e) => setItemField("availabilityStatus", e.target.value)}>
                  {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Form.Select>
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
