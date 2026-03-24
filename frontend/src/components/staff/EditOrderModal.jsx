import { Button, Col, Form, Modal, Row, Spinner } from "react-bootstrap";

export default function EditOrderModal({
  show,
  onClose,
  onSubmit,
  editingOrder,
  editingStatus,
  setEditingStatus,
  editingItems,
  onChangeEditItem,
  addEditItem,
  removeEditItem,
  menuItems,
  fmtCur,
  updating,
  statusOptions,
  statusUi,
}) {
  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Form onSubmit={onSubmit}>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">
            ✏️ Cập nhật đơn — <span style={{ color: "#6366f1" }}>{editingOrder?.orderCode}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4">
          <div className="mb-4">
            <Form.Label className="fw-bold mb-2">Trạng thái đơn hàng</Form.Label>
            <div className="d-flex flex-wrap gap-2">
              {statusOptions.map((s) => {
                const ui = statusUi[s];
                const active = editingStatus === s;
                return (
                  <div
                    key={s}
                    onClick={() => setEditingStatus(s)}
                    className="rounded-3 px-3 py-2 d-flex align-items-center gap-2"
                    style={{
                      background: active ? ui.bg : "#f8fafc",
                      border: `2px solid ${active ? ui.color : "#e2e8f0"}`,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      fontWeight: 600,
                      fontSize: "0.87rem",
                      color: active ? ui.color : "#475569",
                    }}
                  >
                    <i className={`bi ${ui.icon}`} />
                    {ui.label}
                    {active && <i className="bi bi-check-circle-fill ms-1" style={{ color: ui.color }} />}
                  </div>
                );
              })}
            </div>
          </div>

          {editingOrder && (
            <div className="rounded-3 p-3 mb-3" style={{ background: "#f8fafc", fontSize: "0.84rem" }}>
              <div className="d-flex gap-4 flex-wrap">
                <div><span style={{ color: "#64748b" }}>👤 Khách: </span><strong>{editingOrder.customerName || "Khách lẻ"}</strong></div>
                <div><span style={{ color: "#64748b" }}>🪑 Bàn: </span><strong>{editingOrder.tableName || "--"}</strong></div>
                <div><span style={{ color: "#64748b" }}>💰 Tổng: </span><strong style={{ color: "#15803d" }}>{fmtCur(editingOrder.totalAmount)}</strong></div>
              </div>
            </div>
          )}

          <div className="d-flex justify-content-between align-items-center mb-3 px-2 py-2 rounded-3" style={{ background: "#f8fafc" }}>
            <h6 className="mb-0 fw-bold">🍽️ Danh sách món</h6>
            <Button variant="outline-primary" size="sm" type="button" className="rounded-3" onClick={addEditItem}>
              <i className="bi bi-plus-lg me-1" />Thêm món
            </Button>
          </div>

          {editingItems.map((item, index) => (
            <Row className="g-2 mb-2 align-items-center" key={`edit-line-${index}`}>
              <Col md={6}>
                <Form.Select
                  value={item.menuItemId}
                  onChange={(e) => onChangeEditItem(index, "menuItemId", e.target.value)}
                  required
                >
                  <option value="">Chọn món...</option>
                  {menuItems.map((m) => (
                    <option key={String(m._id)} value={String(m._id)}>
                      {m.name} — {fmtCur(m.price)}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Control
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => onChangeEditItem(index, "quantity", e.target.value)}
                  required
                  placeholder="SL"
                />
              </Col>
              <Col md={3}>
                <Form.Control
                  value={item.note}
                  onChange={(e) => onChangeEditItem(index, "note", e.target.value)}
                  placeholder="Ghi chú"
                />
              </Col>
              <Col md={1}>
                <Button variant="outline-danger" type="button" className="w-100 rounded-3" onClick={() => removeEditItem(index)}>
                  <i className="bi bi-x-lg" />
                </Button>
              </Col>
            </Row>
          ))}
        </Modal.Body>
        <Modal.Footer className="border-0 px-4 pb-4">
          <Button variant="outline-secondary" className="fw-semibold rounded-3" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            className="fw-bold rounded-3"
            style={{ background: "#6366f1", border: "none" }}
            disabled={updating}
          >
            {updating ? <><Spinner size="sm" className="me-1" />Đang lưu...</> : "💾 Lưu thay đổi"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
