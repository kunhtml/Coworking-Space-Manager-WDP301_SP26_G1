import { Button, Col, Form, Modal, Row } from "react-bootstrap";

export default function EditOrderModal({
  show,
  onHide,
  submitOrder,
  orderMode,
  targetBookingId,
  addOrderLine,
  orderLines,
  menuItems,
  updateOrderLine,
  removeOrderLine,
  fmt,
  savingOrder,
}) {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Form onSubmit={submitOrder}>
        <Modal.Header closeButton>
          <Modal.Title>{orderMode === "create" ? "Tạo đơn hàng" : "Cập nhật đơn hàng"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <small className="text-muted">
              Booking: {targetBookingId ? String(targetBookingId).slice(-6).toUpperCase() : "--"}
            </small>
            <Button size="sm" variant="outline-primary" onClick={addOrderLine} type="button">
              <i className="bi bi-plus-lg me-1"></i>Thêm món
            </Button>
          </div>

          <Row className="g-2 fw-semibold text-muted small mb-2 px-1">
            <Col md={5}>Món</Col>
            <Col md={2}>Số lượng</Col>
            <Col md={4}>Ghi chú</Col>
            <Col md={1}></Col>
          </Row>

          {orderLines.map((line, idx) => (
            <Row className="g-2 mb-2" key={`${idx}-${line.menuItemId}`}>
              <Col md={5}>
                <Form.Select
                  value={line.menuItemId}
                  onChange={(e) => updateOrderLine(idx, "menuItemId", e.target.value)}
                  required
                >
                  <option value="">Chọn món...</option>
                  {menuItems.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} - {fmt(m.price)}d
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Control
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) => updateOrderLine(idx, "quantity", e.target.value)}
                  required
                />
              </Col>
              <Col md={4}>
                <Form.Control
                  value={line.note}
                  onChange={(e) => updateOrderLine(idx, "note", e.target.value)}
                  placeholder="Ghi chú"
                />
              </Col>
              <Col md={1} className="d-grid">
                <Button type="button" variant="outline-danger" onClick={() => removeOrderLine(idx)}>
                  <i className="bi bi-x-lg"></i>
                </Button>
              </Col>
            </Row>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Hủy</Button>
          <Button type="submit" variant="primary" disabled={savingOrder}>
            {savingOrder ? "Đang lưu..." : "Lưu đơn hàng"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
