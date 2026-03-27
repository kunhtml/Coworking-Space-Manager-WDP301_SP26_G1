import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import { apiClient } from "../../services/api";
import {
  createCounterOrder,
  getStaffTables,
} from "../../services/staffDashboardService";

function fmtCur(v) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(v || 0))}đ`;
}

function normalizeMenuStatus(item) {
  const availability = String(item?.availabilityStatus || "")
    .trim()
    .toUpperCase();
  const stock = Number(item?.stockQuantity || 0);

  if (["UNAVAILABLE", "DISCONTINUED"].includes(availability)) {
    return "UNAVAILABLE";
  }
  if (["OUT_OF_STOCK", "OUTOFSTOCK"].includes(availability)) {
    return "OUT_OF_STOCK";
  }
  if (["IN_STOCK", "AVAILABLE"].includes(availability)) {
    return stock > 0 ? "AVAILABLE" : "OUT_OF_STOCK";
  }
  return stock > 0 ? "AVAILABLE" : "OUT_OF_STOCK";
}

export default function StaffCounterOrderPage() {
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [tableId, setTableId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const [tableRows, menuRows] = await Promise.all([
          getStaffTables(),
          apiClient.get("/menu/items?admin=true"),
        ]);
        setTables(Array.isArray(tableRows) ? tableRows : []);
        setMenuItems(Array.isArray(menuRows) ? menuRows : []);
      } catch (err) {
        setError(err.message || "Không thể tải dữ liệu POS.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const availableMenu = useMemo(
    () =>
      menuItems.filter((item) => {
        return normalizeMenuStatus(item) === "AVAILABLE";
      }),
    [menuItems],
  );

  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum + Number(item.price || 0) * Number(item.quantity || 0),
        0,
      ),
    [cart],
  );

  const addToCart = (menuItem) => {
    setCart((prev) => {
      const found = prev.find(
        (item) => String(item.menuItemId) === String(menuItem._id),
      );
      if (found) {
        return prev.map((item) =>
          String(item.menuItemId) === String(menuItem._id)
            ? { ...item, quantity: Number(item.quantity || 0) + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          menuItemId: menuItem._id,
          name: menuItem.name,
          price: Number(menuItem.price || 0),
          quantity: 1,
        },
      ];
    });
  };

  const updateQty = (menuItemId, qty) => {
    const nextQty = Number(qty || 0);
    if (nextQty <= 0) {
      setCart((prev) =>
        prev.filter((item) => String(item.menuItemId) !== String(menuItemId)),
      );
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        String(item.menuItemId) === String(menuItemId)
          ? { ...item, quantity: nextQty }
          : item,
      ),
    );
  };

  const submitCounterOrder = async () => {
    if (!cart.length) {
      setError("Giỏ hàng trống.");
      return;
    }

    setCreating(true);
    setError("");
    try {
      const payload = {
        tableId: tableId || undefined,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        items: cart.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: Number(item.quantity || 0),
          note: "",
        })),
        paymentMethod,
      };

      const result = await createCounterOrder(payload);
      setSuccess(
        `Tạo đơn thành công: ${result.orderCode} - ${fmtCur(result.totalAmount)}`,
      );
      const checkoutUrl =
        result?.payment?.checkoutUrl ||
        result?.payment?.payment?.payos?.checkoutUrl;
      if (paymentMethod === "QR_PAYOS" && checkoutUrl) {
        window.open(checkoutUrl, "_blank");
      }
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setTableId("");
    } catch (err) {
      setError(err.message || "Tạo counter order thất bại.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">POS tại quầy</h2>
        <p className="text-muted mb-0">
          Tạo đơn nhanh theo kiểu VietKiot cho nhân viên
        </p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner /> Đang tải dữ liệu...
        </div>
      ) : (
        <Row className="g-3">
          <Col lg={8}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white fw-bold">
                Danh sách món
              </Card.Header>
              <Card.Body>
                <Row className="g-2">
                  {availableMenu.map((item) => (
                    <Col md={6} xl={4} key={String(item._id)}>
                      <Card className="h-100 border">
                        <Card.Body className="d-flex flex-column">
                          <div className="fw-bold">{item.name}</div>
                          <div className="text-muted small mb-2">
                            {item.description || "--"}
                          </div>
                          <div className="mt-auto d-flex justify-content-between align-items-center">
                            <span className="fw-bold text-success">
                              {fmtCur(item.price)}
                            </span>
                            <Button size="sm" onClick={() => addToCart(item)}>
                              Thêm
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="border-0 shadow-sm mb-3">
              <Card.Header className="bg-white fw-bold">
                Thông tin đơn
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-2">
                  <Form.Label>Bàn (tuỳ chọn)</Form.Label>
                  <Form.Select
                    value={tableId}
                    onChange={(e) => setTableId(e.target.value)}
                  >
                    <option value="">Không chọn bàn</option>
                    {tables.map((table) => (
                      <option key={String(table.id)} value={String(table.id)}>
                        {table.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Tên khách</Form.Label>
                  <Form.Control
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>SĐT khách</Form.Label>
                  <Form.Control
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label>Thanh toán</Form.Label>
                  <Form.Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="CASH">CASH</option>
                    <option value="QR_PAYOS">QR_PAYOS</option>
                  </Form.Select>
                </Form.Group>
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white fw-bold">Giỏ hàng</Card.Header>
              <Card.Body>
                {cart.length === 0 ? (
                  <div className="text-muted">Chưa có món</div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={String(item.menuItemId)}
                      className="mb-2 pb-2 border-bottom"
                    >
                      <div className="fw-semibold">{item.name}</div>
                      <div className="d-flex justify-content-between align-items-center mt-1">
                        <Form.Control
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateQty(item.menuItemId, e.target.value)
                          }
                          style={{ width: 90 }}
                        />
                        <span>
                          {fmtCur(
                            Number(item.price || 0) *
                              Number(item.quantity || 0),
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                )}

                <hr />
                <div className="d-flex justify-content-between fw-bold mb-3">
                  <span>Tổng</span>
                  <span>{fmtCur(cartTotal)}</span>
                </div>

                <Button
                  className="w-100"
                  disabled={creating || !cart.length}
                  onClick={submitCounterOrder}
                >
                  {creating ? "Đang tạo..." : "Tạo đơn tại quầy"}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </AdminLayout>
  );
}
