import { Button, Col, Form, Modal, Row } from "react-bootstrap";

export default function SpaceFormModal({
  show,
  onHide,
  onSubmit,
  title,
  submitText,
  formData,
  setFormData,
  capacityError,
  setCapacityError,
  priceError,
  setPriceError,
  mode,
}) {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Form onSubmit={onSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Ten ban *</Form.Label>
                <Form.Control type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Suc chua *</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  step="1"
                  value={formData.capacity}
                  isInvalid={!!capacityError}
                  onKeyDown={(e) => {
                    if (["-", "e", "E", "+", "."].includes(e.key)) {
                      e.preventDefault();
                      setCapacityError("Suc chua phai la so nguyen duong");
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setFormData({ ...formData, capacity: value });
                      setCapacityError("");
                    } else if (Number(value) >= 1 && Number.isInteger(Number(value))) {
                      setFormData({ ...formData, capacity: value });
                      setCapacityError("");
                    } else {
                      setCapacityError("Suc chua phai la so nguyen duong (>= 1)");
                    }
                  }}
                  required
                />
                <Form.Control.Feedback type="invalid">{capacityError}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Gia/gio *</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.pricePerHour}
                  isInvalid={!!priceError}
                  onKeyDown={(e) => {
                    if (["-", "e", "E", "+"].includes(e.key)) {
                      e.preventDefault();
                      setPriceError("Gia khong duoc am");
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setFormData({ ...formData, pricePerHour: value });
                      setPriceError("");
                    } else if (Number(value) >= 0) {
                      setFormData({ ...formData, pricePerHour: value });
                      setPriceError("");
                    } else {
                      setPriceError("Gia phai la so khong am (>= 0)");
                    }
                  }}
                  required
                />
                <Form.Control.Feedback type="invalid">{priceError}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Vi tri</Form.Label>
                <Form.Control type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
              </Form.Group>
            </Col>
            {mode === "edit" ? (
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Trang thai</Form.Label>
                  <Form.Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option value="Available">Co san</option>
                    <option value="Occupied">Dang su dung</option>
                    <option value="Maintenance">Bao tri</option>
                    <option value="Reserved">Da dat</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            ) : null}
            <Col md={12}>
              <Form.Group>
                <Form.Label>Mo ta</Form.Label>
                <Form.Control as="textarea" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Huy</Button>
          <Button variant={mode === "add" ? "success" : "info"} type="submit">{submitText}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
