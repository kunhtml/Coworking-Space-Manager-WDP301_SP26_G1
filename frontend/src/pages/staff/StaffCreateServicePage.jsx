import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import { apiClient } from "../../services/api";
import { createCounterOrder, getStaffTables } from "../../services/staffDashboardService";

function fmtPrice(value) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))}đ`;
}

function isServiceAvailable(item) {
  const availability = String(item?.availabilityStatus || "Available");
  const stock = Number(item?.stockQuantity || 0);
  if (availability === "Unavailable" || availability === "OutOfStock") return false;
  return stock > 0;
}

export default function StaffCreateServicePage() {
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedTableId, setSelectedTableId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [creatingOrder, setCreatingOrder] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [tableRows, categoryRows, itemRows] = await Promise.all([
        getStaffTables({}),
        apiClient.get("/menu/categories"),
        apiClient.get("/menu/items"),
      ]);

      setTables(Array.isArray(tableRows) ? tableRows : []);
      setCategories(Array.isArray(categoryRows) ? categoryRows : []);
      setServices(Array.isArray(itemRows) ? itemRows : []);
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu dịch vụ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const categoryId = String(service?.categoryId?._id || service?.categoryId || "");
      const byCategory = selectedCategory === "all" || categoryId === selectedCategory;
      return byCategory;
    });
  }, [services, selectedCategory]);

  const addToCart = (service) => {
    if (!isServiceAvailable(service)) return;
    setCart((prev) => {
      const idx = prev.findIndex((x) => String(x.menuItemId) === String(service._id));
      if (idx === -1) {
        return [
          ...prev,
          {
            menuItemId: String(service._id),
            name: service.name,
            price: Number(service.price || 0),
            quantity: 1,
            note: "",
          },
        ];
      }
      return prev.map((x, i) =>
        i === idx ? { ...x, quantity: Number(x.quantity || 0) + 1 } : x,
      );
    });
  };

  const updateCartItem = (menuItemId, patch) => {
    setCart((prev) =>
      prev
        .map((x) =>
          String(x.menuItemId) === String(menuItemId) ? { ...x, ...patch } : x,
        )
        .filter((x) => Number(x.quantity || 0) > 0),
    );
  };

  const removeCartItem = (menuItemId) => {
    setCart((prev) => prev.filter((x) => String(x.menuItemId) !== String(menuItemId)));
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );

  const submitCreateServiceOrder = async () => {
    setError("");
    setSuccess("");

    if (!selectedTableId) {
      setError("Vui lòng chọn chỗ ngồi trước khi tạo đơn dịch vụ.");
      return;
    }
    if (!cart.length) {
      setError("Vui lòng chọn ít nhất 1 dịch vụ.");
      return;
    }

    setCreatingOrder(true);
    try {
      const payload = {
        tableId: selectedTableId,
        items: cart.map((x) => ({
          menuItemId: x.menuItemId,
          quantity: Number(x.quantity || 0),
          note: x.note || "",
        })),
      };
      const res = await createCounterOrder(payload);
      setSuccess(res.message || "Tạo đơn dịch vụ thành công.");
      setCart([]);
      await loadData();
    } catch (err) {
      setError(err.message || "Tạo đơn dịch vụ thất bại.");
    } finally {
      setCreatingOrder(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Tạo đơn dịch vụ</h2>
        <p className="text-secondary fw-semibold small mb-0">
          Danh sách đồ uống, in ấn, thiết bị được tải từ MongoDB
        </p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="mb-3" style={{ maxWidth: "280px" }}>
        <Form.Select
          className="staff-filter-control"
          value={selectedTableId}
          onChange={(e) => setSelectedTableId(e.target.value)}
        >
          <option value="">-- Chọn chỗ ngồi --</option>
          {tables.map((table) => (
            <option key={String(table.id)} value={String(table.id)}>
              {table.name} ({table.tableType})
            </option>
          ))}
        </Form.Select>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          className={`staff-chip ${selectedCategory === "all" ? "active" : ""}`}
          onClick={() => setSelectedCategory("all")}
        >
          Tất cả
        </button>
        {categories.map((category) => (
          <button
            type="button"
            key={String(category._id)}
            className={`staff-chip ${selectedCategory === String(category._id) ? "active" : ""}`}
            onClick={() => setSelectedCategory(String(category._id))}
          >
            {category.name}
          </button>
        ))}
      </div>

      <Row className="g-3">
        <Col xl={9}>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <Row className="g-3">
              {filteredServices.map((service) => {
                const available = isServiceAvailable(service);
                return (
                  <Col lg={4} md={6} key={String(service._id)}>
                    <Card
                      className="border-0 shadow-sm staff-service-card h-100"
                      onClick={() => addToCart(service)}
                      style={{ cursor: available ? "pointer" : "not-allowed", opacity: available ? 1 : 0.65 }}
                    >
                      <div className="staff-service-thumb">
                        <i className="bi bi-cup-hot"></i>
                      </div>
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <h6 className="fw-bold mb-0">{service.name}</h6>
                          <Badge className="staff-price-badge">{fmtPrice(service.price)}</Badge>
                        </div>
                        <small className="text-secondary fw-semibold">{service.description || "Không có mô tả"}</small>
                        {!available && (
                          <div className="mt-2">
                            <Badge className="bg-danger-subtle text-danger border-0">Hết hàng</Badge>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </Col>

        <Col xl={3}>
          <Card className="border-0 shadow-sm staff-panel-card h-100">
            <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-cart3 me-2 text-primary"></i>
                Đơn dịch vụ
              </h5>
              <small className="text-secondary fw-semibold">{cart.length} món</small>
            </Card.Header>
            <Card.Body>
              {cart.length === 0 ? (
                <div className="d-flex align-items-center justify-content-center text-center h-100">
                  <div className="text-secondary fw-semibold">
                    <i className="bi bi-cup-hot" style={{ fontSize: "48px" }}></i>
                    <div className="mt-2">Chưa có dịch vụ</div>
                    <div>Chọn dịch vụ từ danh sách bên trái</div>
                  </div>
                </div>
              ) : (
                <div>
                  {cart.map((item) => (
                    <div key={String(item.menuItemId)} className="border rounded-3 p-2 mb-2">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <strong>{item.name}</strong>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeCartItem(item.menuItemId)}
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <Form.Control
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateCartItem(item.menuItemId, {
                              quantity: Number(e.target.value || 0),
                            })
                          }
                        />
                        <small className="text-secondary">x {fmtPrice(item.price)}</small>
                      </div>
                      <Form.Control
                        size="sm"
                        placeholder="Ghi chú"
                        value={item.note || ""}
                        onChange={(e) => updateCartItem(item.menuItemId, { note: e.target.value })}
                      />
                    </div>
                  ))}

                  <div className="d-flex justify-content-between fw-bold mt-3 mb-2">
                    <span>Tổng cộng</span>
                    <span>{fmtPrice(totalAmount)}</span>
                  </div>

                  <Button
                    className="staff-primary-btn w-100"
                    disabled={creatingOrder}
                    onClick={submitCreateServiceOrder}
                  >
                    {creatingOrder ? "Đang tạo đơn..." : "Tạo đơn dịch vụ"}
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </AdminLayout>
  );
}
