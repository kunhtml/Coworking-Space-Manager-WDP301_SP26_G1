import { Button, Col, Form, Row } from "react-bootstrap";

export default function OrderForm({
  createForm,
  setCreateForm,
  tables,
  menuItems,
  onChangeCreateItem,
  addCreateItem,
  removeCreateItem,
  fmtCur,
}) {
  return (
    <>
      <Row className="g-3 mb-3">
        <Col md={6}>
          <Form.Label className="fw-semibold">Ban <span className="text-danger">*</span></Form.Label>
          <Form.Select
            value={createForm.tableId}
            onChange={(e) => setCreateForm((p) => ({ ...p, tableId: e.target.value }))}
            required
          >
            <option value="">Chon ban...</option>
            {tables.map((t) => (
              <option key={String(t.id)} value={String(t.id)}>
                {t.name} ({t.tableType})
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Label className="fw-semibold">Thoi luong (gio)</Form.Label>
          <Form.Control
            type="number"
            min={1}
            value={createForm.durationHours}
            onChange={(e) => setCreateForm((p) => ({ ...p, durationHours: e.target.value }))}
          />
        </Col>
        <Col md={3}>
          <Form.Label className="fw-semibold">Ten khach</Form.Label>
          <Form.Control
            value={createForm.customerName}
            onChange={(e) => setCreateForm((p) => ({ ...p, customerName: e.target.value }))}
            placeholder="Ten khach hang"
          />
        </Col>
        <Col md={3}>
          <Form.Label className="fw-semibold">So dien thoai</Form.Label>
          <Form.Control
            value={createForm.customerPhone}
            onChange={(e) => setCreateForm((p) => ({ ...p, customerPhone: e.target.value }))}
            placeholder="0912..."
          />
        </Col>
      </Row>

      <div className="d-flex justify-content-between align-items-center mb-3 px-2 py-2 rounded-3" style={{ background: "#f8fafc" }}>
        <h6 className="mb-0 fw-bold">Danh sach mon</h6>
        <Button variant="outline-primary" size="sm" type="button" className="rounded-3" onClick={addCreateItem}>
          <i className="bi bi-plus-lg me-1" />Them mon
        </Button>
      </div>

      {createForm.items.map((item, index) => (
        <Row className="g-2 mb-2 align-items-center" key={`create-line-${index}`}>
          <Col md={6}>
            <Form.Select
              value={item.menuItemId}
              onChange={(e) => onChangeCreateItem(index, "menuItemId", e.target.value)}
              required
            >
              <option value="">Chon mon...</option>
              {menuItems.map((m) => (
                <option key={String(m._id)} value={String(m._id)}>
                  {m.name} - {fmtCur(m.price)}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Control
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => onChangeCreateItem(index, "quantity", e.target.value)}
              required
              placeholder="SL"
            />
          </Col>
          <Col md={3}>
            <Form.Control
              value={item.note}
              onChange={(e) => onChangeCreateItem(index, "note", e.target.value)}
              placeholder="Ghi chu (tuy chon)"
            />
          </Col>
          <Col md={1}>
            <Button
              variant="outline-danger"
              type="button"
              className="w-100 rounded-3"
              onClick={() => removeCreateItem(index)}
            >
              <i className="bi bi-x-lg" />
            </Button>
          </Col>
        </Row>
      ))}
    </>
  );
}
