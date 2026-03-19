import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import { apiClient } from "../../services/api";
import {
  createCounterOrder,
  exportStaffOrderInvoice,
  getStaffOrderInvoice,
  getStaffOrders,
  getStaffTables,
  updateStaffOrder,
} from "../../services/staffDashboardService";

const ORDER_STATUS_OPTIONS = ["Pending", "Confirmed", "Cancelled", "Completed"];

const ORDER_STATUS_UI = {
  Pending: { label: "Chờ xử lý", className: "bg-warning-subtle text-warning" },
  Confirmed: { label: "Đã xác nhận", className: "bg-primary-subtle text-primary" },
  Cancelled: { label: "Đã hủy", className: "bg-danger-subtle text-danger" },
  Completed: { label: "Hoàn thành", className: "bg-info-subtle text-info" },
};

function formatCurrency(value) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))}đ`;
}

function toTime(value) {
  if (!value) return "--";
  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createEmptyLine() {
  return { menuItemId: "", quantity: 1, note: "" };
}

export default function StaffOrderManagementPage() {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    tableId: "",
    customerName: "",
    customerPhone: "",
    durationHours: 2,
    items: [createEmptyLine()],
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingStatus, setEditingStatus] = useState("Pending");
  const [editingItems, setEditingItems] = useState([createEmptyLine()]);
  const [updating, setUpdating] = useState(false);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const loadPageData = async () => {
    setLoading(true);
    setError("");
    try {
      const [orderRows, tableRows, menuRows] = await Promise.all([
        getStaffOrders({
          status: statusFilter === "all" ? "" : statusFilter,
          search,
          date: dateFilter,
        }),
        getStaffTables({}),
        apiClient.get("/menu/items"),
      ]);
      setOrders(Array.isArray(orderRows) ? orderRows : []);
      setTables(Array.isArray(tableRows) ? tableRows : []);
      setMenuItems(Array.isArray(menuRows) ? menuRows : []);
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      loadPageData();
    }, 200);
    return () => clearTimeout(t);
  }, [statusFilter, search, dateFilter]);

  const displayOrders = useMemo(() => {
    if (tableFilter === "all") return orders;
    return orders.filter((o) => String(o.tableId || "") === tableFilter);
  }, [orders, tableFilter]);

  const onChangeCreateItem = (index, key, value) => {
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) =>
        idx === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const addCreateItem = () => {
    setCreateForm((prev) => ({ ...prev, items: [...prev.items, createEmptyLine()] }));
  };

  const removeCreateItem = (index) => {
    setCreateForm((prev) => ({
      ...prev,
      items:
        prev.items.length <= 1
          ? prev.items
          : prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const submitCreateCounterOrder = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await createCounterOrder({
        tableId: createForm.tableId,
        customerName: createForm.customerName,
        customerPhone: createForm.customerPhone,
        durationHours: Number(createForm.durationHours || 2),
        items: createForm.items,
      });
      setShowCreateModal(false);
      setCreateForm({
        tableId: "",
        customerName: "",
        customerPhone: "",
        durationHours: 2,
        items: [createEmptyLine()],
      });
      await loadPageData();
    } catch (err) {
      setError(err.message || "Tạo counter order thất bại.");
    } finally {
      setCreating(false);
    }
  };

  const openEditOrder = (order) => {
    setEditingOrder(order);
    setEditingStatus(order.status || "Pending");
    setEditingItems(
      (order.items || []).length
        ? order.items.map((it) => ({
            menuItemId: String(it.menuItemId || ""),
            quantity: Number(it.quantity || 1),
            note: it.note || "",
          }))
        : [createEmptyLine()],
    );
    setShowEditModal(true);
  };

  const onChangeEditItem = (index, key, value) => {
    setEditingItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)),
    );
  };

  const addEditItem = () => setEditingItems((prev) => [...prev, createEmptyLine()]);

  const removeEditItem = (index) => {
    setEditingItems((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index),
    );
  };

  const submitUpdateOrder = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    setUpdating(true);
    setError("");
    try {
      await updateStaffOrder(editingOrder.id, {
        status: editingStatus,
        items: editingItems,
      });
      setShowEditModal(false);
      await loadPageData();
    } catch (err) {
      setError(err.message || "Cập nhật order thất bại.");
    } finally {
      setUpdating(false);
    }
  };

  const openInvoiceModal = async (orderId) => {
    setInvoiceLoading(true);
    setShowInvoiceModal(true);
    setInvoiceData(null);
    setError("");
    try {
      const data = await getStaffOrderInvoice(orderId);
      setInvoiceData(data);
    } catch (err) {
      setError(err.message || "Không thể tải hóa đơn.");
    } finally {
      setInvoiceLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Quản lý đơn dịch vụ</h2>
        <p className="text-secondary fw-semibold small mb-0">
          Dữ liệu order, invoice và counter order từ MongoDB
        </p>
      </div>

      <Row className="g-3 mb-3 align-items-center">
        <Col md={3}>
          <Form.Select
            className="staff-filter-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            {ORDER_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS_UI[status]?.label || status}
              </option>
            ))}
          </Form.Select>
        </Col>

        <Col md={3}>
          <div className="staff-search-wrap">
            <i className="bi bi-search"></i>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã order"
            />
          </div>
        </Col>

        <Col md={2}>
          <Form.Control
            type="date"
            className="staff-filter-control"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </Col>

        <Col md={2}>
          <Form.Select
            className="staff-filter-control"
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
          >
            <option value="all">Tất cả chỗ ngồi</option>
            {tables.map((t) => (
              <option key={String(t.id)} value={String(t.id)}>
                {t.name}
              </option>
            ))}
          </Form.Select>
        </Col>

        <Col className="text-md-end">
          <Button className="staff-secondary-btn" onClick={() => setShowCreateModal(true)}>
            <i className="bi bi-plus-lg me-2"></i>
            Tạo đơn mới
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm staff-panel-card">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : displayOrders.length === 0 ? (
            <Alert variant="secondary" className="m-3">
              Không có order nào phù hợp bộ lọc.
            </Alert>
          ) : (
            <Table responsive className="mb-0 align-middle staff-table">
              <thead>
                <tr>
                  <th>MÃ ĐƠN</th>
                  <th>KHÁCH HÀNG</th>
                  <th>CHỖ</th>
                  <th>DỊCH VỤ</th>
                  <th>TỔNG</th>
                  <th>TRẠNG THÁI</th>
                  <th>GIỜ</th>
                  <th>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {displayOrders.map((order) => {
                  const statusUi = ORDER_STATUS_UI[order.status] || {
                    label: order.status || "Unknown",
                    className: "bg-secondary-subtle text-secondary",
                  };

                  return (
                    <tr key={String(order.id)}>
                      <td className="fw-bold">{order.orderCode}</td>
                      <td className="fw-semibold">{order.customerName || "Khách lẻ"}</td>
                      <td className="fw-semibold">{order.tableName || "--"}</td>
                      <td className="fw-semibold">
                        {(order.items || [])
                          .map((it) => `${it.menuName} x${it.quantity}`)
                          .join(", ") || "--"}
                      </td>
                      <td className="fw-bold">{formatCurrency(order.totalAmount)}</td>
                      <td>
                        <Badge className={`rounded-pill border-0 px-3 py-2 ${statusUi.className}`}>
                          {statusUi.label}
                        </Badge>
                      </td>
                      <td className="fw-semibold">{toTime(order.createdAt)}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <button className="staff-icon-btn" type="button" onClick={() => openEditOrder(order)}>
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button
                            className="staff-icon-btn staff-icon-btn-success"
                            type="button"
                            onClick={() => openInvoiceModal(order.id)}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
        <Form onSubmit={submitCreateCounterOrder}>
          <Modal.Header closeButton>
            <Modal.Title>Tạo counter order</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label>Bàn</Form.Label>
                <Form.Select
                  value={createForm.tableId}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, tableId: e.target.value }))}
                  required
                >
                  <option value="">Chọn bàn...</option>
                  {tables.map((t) => (
                    <option key={String(t.id)} value={String(t.id)}>
                      {t.name} ({t.tableType})
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Label>Khách</Form.Label>
                <Form.Control
                  value={createForm.customerName}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Tên khách"
                />
              </Col>
              <Col md={3}>
                <Form.Label>SĐT</Form.Label>
                <Form.Control
                  value={createForm.customerPhone}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, customerPhone: e.target.value }))}
                  placeholder="Số điện thoại"
                />
              </Col>
              <Col md={3}>
                <Form.Label>Thời lượng (giờ)</Form.Label>
                <Form.Control
                  type="number"
                  min={1}
                  value={createForm.durationHours}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, durationHours: e.target.value }))}
                />
              </Col>
            </Row>

            <hr />
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Danh sách món</h6>
              <Button variant="outline-primary" size="sm" type="button" onClick={addCreateItem}>
                <i className="bi bi-plus-lg me-1"></i>Thêm món
              </Button>
            </div>

            {createForm.items.map((item, index) => (
              <Row className="g-2 mb-2" key={`create-line-${index}`}>
                <Col md={6}>
                  <Form.Select
                    value={item.menuItemId}
                    onChange={(e) => onChangeCreateItem(index, "menuItemId", e.target.value)}
                    required
                  >
                    <option value="">Chọn món...</option>
                    {menuItems.map((m) => (
                      <option key={String(m._id)} value={String(m._id)}>
                        {m.name} - {formatCurrency(m.price)}
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
                  />
                </Col>
                <Col md={3}>
                  <Form.Control
                    value={item.note}
                    onChange={(e) => onChangeCreateItem(index, "note", e.target.value)}
                    placeholder="Ghi chú"
                  />
                </Col>
                <Col md={1} className="d-grid">
                  <Button variant="outline-danger" type="button" onClick={() => removeCreateItem(index)}>
                    <i className="bi bi-x-lg"></i>
                  </Button>
                </Col>
              </Row>
            ))}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" disabled={creating}>
              {creating ? "Đang tạo..." : "Tạo đơn"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
        <Form onSubmit={submitUpdateOrder}>
          <Modal.Header closeButton>
            <Modal.Title>Cập nhật order {editingOrder?.orderCode || ""}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="g-3 mb-3">
              <Col md={4}>
                <Form.Label>Trạng thái</Form.Label>
                <Form.Select value={editingStatus} onChange={(e) => setEditingStatus(e.target.value)}>
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {ORDER_STATUS_UI[status]?.label || status}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>

            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Món trong order</h6>
              <Button variant="outline-primary" size="sm" type="button" onClick={addEditItem}>
                <i className="bi bi-plus-lg me-1"></i>Thêm món
              </Button>
            </div>

            {editingItems.map((item, index) => (
              <Row className="g-2 mb-2" key={`edit-line-${index}`}>
                <Col md={6}>
                  <Form.Select
                    value={item.menuItemId}
                    onChange={(e) => onChangeEditItem(index, "menuItemId", e.target.value)}
                    required
                  >
                    <option value="">Chọn món...</option>
                    {menuItems.map((m) => (
                      <option key={String(m._id)} value={String(m._id)}>
                        {m.name} - {formatCurrency(m.price)}
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
                  />
                </Col>
                <Col md={3}>
                  <Form.Control
                    value={item.note}
                    onChange={(e) => onChangeEditItem(index, "note", e.target.value)}
                    placeholder="Ghi chú"
                  />
                </Col>
                <Col md={1} className="d-grid">
                  <Button variant="outline-danger" type="button" onClick={() => removeEditItem(index)}>
                    <i className="bi bi-x-lg"></i>
                  </Button>
                </Col>
              </Row>
            ))}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" disabled={updating}>
              {updating ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showInvoiceModal} onHide={() => setShowInvoiceModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Hóa đơn order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {invoiceLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : !invoiceData ? (
            <Alert variant="secondary" className="mb-0">
              Không có dữ liệu hóa đơn.
            </Alert>
          ) : (
            <div>
              <div className="d-flex justify-content-between mb-2">
                <span>Mã hóa đơn</span>
                <strong>{invoiceData.invoiceCode}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Mã order</span>
                <strong>{invoiceData.order?.orderCode}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Khách hàng</span>
                <strong>{invoiceData.customer?.name || "Khách lẻ"}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Bàn</span>
                <strong>{invoiceData.table?.name || "--"}</strong>
              </div>

              <hr />
              <h6>Chi tiết món</h6>
              {(invoiceData.items || []).map((line, idx) => (
                <div key={`${line.menuName}-${idx}`} className="d-flex justify-content-between border-bottom py-2">
                  <span>
                    {line.menuName} x{line.quantity}
                  </span>
                  <strong>{formatCurrency(line.lineTotal)}</strong>
                </div>
              ))}

              <hr />
              <div className="d-flex justify-content-between mb-2">
                <span>Tạm tính</span>
                <strong>{formatCurrency(invoiceData.summary?.subTotal)}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Đặt cọc booking</span>
                <strong>{formatCurrency(invoiceData.summary?.depositAmount)}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span className="fw-bold">Tổng cộng</span>
                <strong className="text-primary">{formatCurrency(invoiceData.summary?.totalAmount)}</strong>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowInvoiceModal(false)}>
            Đóng
          </Button>
          <Button
            variant="primary"
            disabled={!invoiceData}
            onClick={() => exportStaffOrderInvoice(invoiceData.order?.id)}
          >
            <i className="bi bi-download me-2"></i>
            Export hóa đơn
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
}
