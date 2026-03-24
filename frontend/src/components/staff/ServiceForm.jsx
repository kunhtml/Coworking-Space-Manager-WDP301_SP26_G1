import { Badge, Button, Card, Form } from "react-bootstrap";

export default function ServiceForm({
  cart,
  updateCartItem,
  removeCartItem,
  totalAmount,
  fmtPrice,
  creatingOrder,
  onSubmit,
}) {
  return (
    <Card className="border-0 shadow-sm staff-panel-card h-100">
      <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center">
        <h5 className="mb-0 fw-bold">
          <i className="bi bi-cart3 me-2 text-primary" />Don dich vu
        </h5>
        <small className="text-secondary fw-semibold">{cart.length} mon</small>
      </Card.Header>
      <Card.Body>
        {cart.length === 0 ? (
          <div className="d-flex align-items-center justify-content-center text-center h-100">
            <div className="text-secondary fw-semibold">
              <i className="bi bi-cup-hot" style={{ fontSize: "48px" }} />
              <div className="mt-2">Chua co dich vu</div>
              <div>Chon dich vu tu danh sach ben trai</div>
            </div>
          </div>
        ) : (
          <div>
            {cart.map((item) => (
              <div key={String(item.menuItemId)} className="border rounded-3 p-2 mb-2">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <strong>{item.name}</strong>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeCartItem(item.menuItemId)}>
                    <i className="bi bi-x-lg" />
                  </button>
                </div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Form.Control
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateCartItem(item.menuItemId, { quantity: Number(e.target.value || 0) })}
                  />
                  <small className="text-secondary">x {fmtPrice(item.price)}</small>
                </div>
                <Form.Control
                  size="sm"
                  placeholder="Ghi chu"
                  value={item.note || ""}
                  onChange={(e) => updateCartItem(item.menuItemId, { note: e.target.value })}
                />
              </div>
            ))}

            <div className="d-flex justify-content-between fw-bold mt-3 mb-2">
              <span>Tong cong</span>
              <span>{fmtPrice(totalAmount)}</span>
            </div>

            <Button className="staff-primary-btn w-100" disabled={creatingOrder} onClick={onSubmit}>
              {creatingOrder ? "Dang tao don..." : "Tao don dich vu"}
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
