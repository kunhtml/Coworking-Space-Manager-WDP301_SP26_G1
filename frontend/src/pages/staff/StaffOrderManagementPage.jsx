import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
  Pagination,
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
import { processCounterPayment } from "../../services/staffPaymentService";

// ── Config ────────────────────────────────────────────────────────────────────
const ORDER_STATUS_OPTIONS = ["COMPLETED", "CANCELLED"];

const ORDER_STATUS_UI = {
  WAITING_PAYMENT: {
    label: "Chờ thanh toán",
    bg: "#fef9c3",
    color: "#92400e",
    icon: "bi-hourglass-split",
  },
  PAID: {
    label: "Đã thanh toán",
    bg: "#dbeafe",
    color: "#1d4ed8",
    icon: "bi-cash-coin",
  },
  COMPLETED: {
    label: "Hoàn thành",
    bg: "#dcfce7",
    color: "#15803d",
    icon: "bi-trophy",
  },
  CANCELLED: {
    label: "Đã hủy",
    bg: "#fee2e2",
    color: "#b91c1c",
    icon: "bi-x-circle",
  },
};

const STAT_GROUPS = [
  {
    key: "all",
    label: "Tất cả",
    icon: "bi-list-ul",
    bg: "#f1f5f9",
    color: "#475569",
  },
  {
    key: "WAITING_PAYMENT",
    label: "Chờ thanh toán",
    icon: "bi-hourglass-split",
    bg: "#fef9c3",
    color: "#92400e",
  },
  {
    key: "PAID",
    label: "Đã thanh toán",
    icon: "bi-cash-coin",
    bg: "#dbeafe",
    color: "#1d4ed8",
  },
  {
    key: "COMPLETED",
    label: "Hoàn thành",
    icon: "bi-trophy",
    bg: "#dcfce7",
    color: "#15803d",
  },
  {
    key: "CANCELLED",
    label: "Đã hủy",
    icon: "bi-x-circle",
    bg: "#fee2e2",
    color: "#b91c1c",
  },
];

function getWorkflowStatus(order) {
  const raw = String(order?.staffStatus || order?.status || "")
    .trim()
    .toUpperCase();
  if (raw === "CANCELED") return "CANCELLED";
  if (["WAITING_PAYMENT", "PAID", "COMPLETED", "CANCELLED"].includes(raw)) {
    return raw;
  }
  return "WAITING_PAYMENT";
}

function fmtCur(v) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(v || 0))}đ`;
}
function toTime(v) {
  if (!v) return "--";
  return new Date(v).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function toDate(v) {
  if (!v) return "--";
  return new Date(v).toLocaleDateString("vi-VN");
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
  const [successMsg, setSuccessMsg] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Create counter order modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    tableId: "",
    customerName: "",
    customerPhone: "",
    durationHours: 2,
    items: [createEmptyLine()],
  });

  // Edit order modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingStatus, setEditingStatus] = useState("COMPLETED");
  const [editingItems, setEditingItems] = useState([createEmptyLine()]);
  const [updating, setUpdating] = useState(false);

  // Invoice modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // ── Load ────────────────────────────────────────────────────────────────────
  const loadPageData = async () => {
    setLoading(true);
    setError("");
    try {
      const [orderRows, tableRows, menuRows] = await Promise.all([
        getStaffOrders({ search, date: dateFilter }),
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
    const t = setTimeout(loadPageData, 250);
    return () => clearTimeout(t);
  }, [search, dateFilter]);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const statCounts = useMemo(() => {
    const c = { all: orders.length };
    STAT_GROUPS.forEach((g) => {
      if (g.key !== "all") {
        c[g.key] = orders.filter((o) => getWorkflowStatus(o) === g.key).length;
      }
    });
    return c;
  }, [orders]);

  // ── Table filter (client-side) ───────────────────────────────────────────────
  const displayOrders = useMemo(() => {
    let rows = orders;
    if (statusFilter !== "all") {
      rows = rows.filter((o) => getWorkflowStatus(o) === statusFilter);
    }
    if (tableFilter !== "all") {
      rows = rows.filter((o) => String(o.tableId || "") === tableFilter);
    }
    return rows;
  }, [orders, statusFilter, tableFilter]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, tableFilter, dateFilter]);

  // Pagination logic
  const totalPages = Math.ceil(displayOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return displayOrders.slice(start, start + itemsPerPage);
  }, [displayOrders, currentPage]);

  // ── Create counter order ─────────────────────────────────────────────────────
  const onChangeCreateItem = (i, k, v) =>
    setCreateForm((p) => ({
      ...p,
      items: p.items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)),
    }));
  const addCreateItem = () =>
    setCreateForm((p) => ({ ...p, items: [...p.items, createEmptyLine()] }));
  const removeCreateItem = (i) =>
    setCreateForm((p) => ({
      ...p,
      items:
        p.items.length <= 1 ? p.items : p.items.filter((_, idx) => idx !== i),
    }));

  const submitCreateCounterOrder = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const result = await createCounterOrder({
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

      // Show success message with payment info
      const bookingAmt = result.bookingAmount || 0;
      const orderAmt = result.orderAmount || 0;
      const totalAmt = result.totalAmount || 0;

      let message = `✅ Tạo đơn counter thành công!`;
      if (totalAmt > 0) {
        message += `\n💰 Tiền thuê bàn: ${bookingAmt.toLocaleString()}đ`;
        if (orderAmt > 0) {
          message += `\n🍽️ Tiền order: ${orderAmt.toLocaleString()}đ`;
        }
        message += `\n📊 Tổng: ${totalAmt.toLocaleString()}đ`;
      }

      setSuccessMsg(message);

      // Open payment link if available
      if (result.payment?.checkoutUrl) {
        const openPayment = window.confirm(
          `Đơn đã tạo thành công!\nTổng tiền: ${totalAmt.toLocaleString()}đ\n\nBạn có muốn mở link thanh toán?`,
        );
        if (openPayment) {
          window.open(result.payment.checkoutUrl, "_blank");
        }
      }

      await loadPageData();
      setTimeout(() => setSuccessMsg(""), 6000);
    } catch (err) {
      setError(err.message || "Tạo counter order thất bại.");
    } finally {
      setCreating(false);
    }
  };

  // ── Edit order ───────────────────────────────────────────────────────────────
  const openEditOrder = (order) => {
    setEditingOrder(order);
    setEditingStatus(
      getWorkflowStatus(order) === "CANCELLED" ? "CANCELLED" : "COMPLETED",
    );
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
    setError("");
  };

  const onChangeEditItem = (i, k, v) =>
    setEditingItems((p) =>
      p.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)),
    );
  const addEditItem = () => setEditingItems((p) => [...p, createEmptyLine()]);
  const removeEditItem = (i) =>
    setEditingItems((p) =>
      p.length <= 1 ? p : p.filter((_, idx) => idx !== i),
    );

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
      setSuccessMsg("✅ Cập nhật đơn hàng thành công!");
      await loadPageData();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.message || "Cập nhật order thất bại.");
    } finally {
      setUpdating(false);
    }
  };

  // ── Quick complete ────────────────────────────────────────────────────────────
  const [completing, setCompleting] = useState(null); // orderId being completed

  const quickCompleteOrder = async (order) => {
    if (completing) return;
    setCompleting(order.id);
    setError("");
    try {
      await updateStaffOrder(order.id, {
        status: "COMPLETED",
        items: (order.items || []).map((it) => ({
          menuItemId: String(it.menuItemId || ""),
          quantity: Number(it.quantity || 1),
          note: it.note || "",
        })),
      });
      setSuccessMsg(`✅ Đơn ${order.orderCode} đã hoàn thành!`);
      await loadPageData();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.message || "Không thể hoàn thành đơn.");
    } finally {
      setCompleting(null);
    }
  };

  // ── Invoice ──────────────────────────────────────────────────────────────────
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

  const handleExport = async () => {
    if (!invoiceData?.order?.id) return;
    setExporting(true);
    try {
      await exportStaffOrderInvoice(invoiceData.order.id);
    } catch (err) {
      setError(err.message || "Export thất bại.");
    } finally {
      setExporting(false);
    }
  };

  // ── Retry payment ────────────────────────────────────────────────────────────────
  const [payingOrderId, setPayingOrderId] = useState(null);

  const retryPayment = async (order, method) => {
    setPayingOrderId(order.id);
    setError("");
    try {
      const result = await processCounterPayment(order.id, method);
      if (method === "QR_PAYOS") {
        const url = result.checkoutUrl || result.payment?.payos?.checkoutUrl;
        if (url) window.open(url, "_blank");
        setSuccessMsg(`✅ Đã tạo QR thanh toán cho ${order.orderCode}`);
      } else {
        setSuccessMsg(`✅ Thanh toán tiền mặt thành công: ${order.orderCode}`);
      }
      await loadPageData();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.message || "Thanh toán thất bại.");
    } finally {
      setPayingOrderId(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1">Quản lý Đơn hàng</h2>
          <p className="text-secondary fw-semibold small mb-0">
            Xem danh sách, cập nhật trạng thái và tạo đơn hàng tại quầy
          </p>
        </div>
        <Button
          className="fw-bold rounded-3 d-flex align-items-center gap-2"
          style={{ background: "#6366f1", border: "none", padding: "9px 20px" }}
          onClick={() => setShowCreateModal(true)}
        >
          <i className="bi bi-plus-lg" />
          Tạo đơn tại quầy
        </Button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <Alert
          className="border-0 rounded-3 mb-3"
          style={{ background: "#dcfce7", color: "#15803d" }}
        >
          {successMsg}
        </Alert>
      )}
      {error && (
        <Alert
          variant="danger"
          className="rounded-3 mb-3"
          dismissible
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {/* Stat chips */}
      <Row className="g-3 mb-4">
        {STAT_GROUPS.map((g) => {
          const active = statusFilter === g.key;
          return (
            <Col xs={6} sm={4} md={2} key={g.key}>
              <div
                onClick={() => setStatusFilter(g.key)}
                className="rounded-4 p-3 d-flex align-items-center gap-2"
                style={{
                  background: active ? g.bg : "#fff",
                  border: `2px solid ${active ? g.color : "#e2e8f0"}`,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: active
                    ? `0 4px 16px ${g.color}22`
                    : "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: 38,
                    height: 38,
                    background: g.bg,
                    fontSize: 16,
                    color: g.color,
                  }}
                >
                  <i className={`bi ${g.icon}`} />
                </div>
                <div>
                  <div
                    className="fw-bold lh-1"
                    style={{ color: g.color, fontSize: "1.2rem" }}
                  >
                    {statCounts[g.key] ?? 0}
                  </div>
                  <div
                    style={{
                      color: "#64748b",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                    }}
                  >
                    {g.label}
                  </div>
                </div>
                {active && (
                  <i
                    className="bi bi-funnel-fill ms-auto"
                    style={{ color: g.color, fontSize: "0.7rem" }}
                  />
                )}
              </div>
            </Col>
          );
        })}
      </Row>

      {/* Filters */}
      <Row className="g-3 mb-4 align-items-center">
        <Col md={3}>
          <div className="staff-search-wrap">
            <i className="bi bi-search" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã đơn, tên khách..."
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
        <Col md={3}>
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
        <Col md="auto">
          <Button
            variant="outline-secondary"
            className="fw-semibold rounded-3"
            onClick={loadPageData}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-1" />
            {loading ? "Đang tải..." : "Làm mới"}
          </Button>
        </Col>
      </Row>

      {/* Order table */}
      <Card className="border-0 shadow-sm staff-panel-card">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: "#6366f1" }} />
              <p className="mt-2 text-muted small fw-semibold">
                Đang tải đơn hàng...
              </p>
            </div>
          ) : displayOrders.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <div style={{ fontSize: 48 }}>📦</div>
              <p className="fw-semibold mt-2">Không có đơn hàng phù hợp</p>
            </div>
          ) : (
            <Table responsive className="mb-0 align-middle staff-table">
              <thead>
                <tr>
                  <th>MÃ ĐƠN</th>
                  <th>KHÁCH HÀNG</th>
                  <th>BÀN</th>
                  <th>MÓN</th>
                  <th>TỔNG</th>
                  <th>TRẠNG THÁI</th>
                  <th>GIỜ / NGÀY</th>
                  <th>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => {
                  const workflowStatus = getWorkflowStatus(order);
                  const stUi = ORDER_STATUS_UI[workflowStatus] || {
                    label: workflowStatus,
                    bg: "#f1f5f9",
                    color: "#475569",
                    icon: "bi-question",
                  };
                  const canComplete = workflowStatus === "PAID";
                  return (
                    <tr key={String(order.id)}>
                      <td>
                        <span className="fw-bold" style={{ color: "#6366f1" }}>
                          {order.orderCode}
                        </span>
                      </td>
                      <td>
                        <div
                          className="fw-semibold"
                          style={{ color: "#0f172a" }}
                        >
                          {order.customerName || "Khách lẻ"}
                        </div>
                        {order.customerPhone && (
                          <div
                            style={{ color: "#64748b", fontSize: "0.78rem" }}
                          >
                            {order.customerPhone}
                          </div>
                        )}
                      </td>
                      <td className="fw-semibold">{order.tableName || "--"}</td>
                      <td style={{ maxWidth: 200 }}>
                        <div style={{ fontSize: "0.82rem", color: "#475569" }}>
                          {(order.items || []).slice(0, 2).map((it) => (
                            <div key={it.menuItemId || it.menuName}>
                              {it.menuName}{" "}
                              <span className="text-muted">x{it.quantity}</span>
                            </div>
                          ))}
                          {(order.items || []).length > 2 && (
                            <div style={{ color: "#94a3b8" }}>
                              +{order.items.length - 2} món khác
                            </div>
                          )}
                          {!(order.items || []).length && "--"}
                        </div>
                      </td>
                      <td>
                        <span className="fw-bold" style={{ color: "#15803d" }}>
                          {fmtCur(order.totalAmount)}
                        </span>
                      </td>
                      <td>
                        <span
                          className="rounded-pill px-3 py-1 fw-bold d-inline-flex align-items-center gap-1"
                          style={{
                            background: stUi.bg,
                            color: stUi.color,
                            fontSize: "0.76rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <i className={`bi ${stUi.icon}`} />
                          {stUi.label}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.82rem", color: "#64748b" }}>
                        <div>{toTime(order.createdAt)}</div>
                        <div>{toDate(order.createdAt)}</div>
                      </td>
                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          <button
                            className="staff-icon-btn"
                            type="button"
                            title="Cập nhật đơn"
                            onClick={() => openEditOrder(order)}
                          >
                            <i className="bi bi-pencil-square" />
                          </button>
                          {workflowStatus === "WAITING_PAYMENT" && (
                            <>
                              <button
                                className="staff-icon-btn"
                                type="button"
                                title="Thanh toán tiền mặt"
                                disabled={payingOrderId === order.id}
                                onClick={() => retryPayment(order, "CASH")}
                                style={{ background: "#dcfce7", color: "#15803d", border: "1.5px solid #bbf7d0" }}
                              >
                                {payingOrderId === order.id ? (
                                  <i className="bi bi-arrow-clockwise" style={{ animation: "spin 0.8s linear infinite" }} />
                                ) : (
                                  <i className="bi bi-cash-coin" />
                                )}
                              </button>
                              <button
                                className="staff-icon-btn"
                                type="button"
                                title="Thanh toán QR PayOS"
                                disabled={payingOrderId === order.id}
                                onClick={() => retryPayment(order, "QR_PAYOS")}
                                style={{ background: "#eef2ff", color: "#6366f1", border: "1.5px solid #c7d2fe" }}
                              >
                                <i className="bi bi-qr-code" />
                              </button>
                              {(() => {
                                const created = new Date(order.createdAt);
                                const expiresAt = new Date(created.getTime() + 15 * 60 * 1000);
                                const remainMs = expiresAt - Date.now();
                                const remainMin = Math.max(0, Math.ceil(remainMs / 60000));
                                return remainMin > 0 ? (
                                  <span style={{ fontSize: "0.62rem", color: "#f59e0b", fontWeight: 700, alignSelf: "center" }}>
                                    ⏰ {remainMin}p
                                  </span>
                                ) : (
                                  <span style={{ fontSize: "0.62rem", color: "#dc2626", fontWeight: 700, alignSelf: "center" }}>
                                    Hết hạn
                                  </span>
                                );
                              })()}
                            </>
                          )}
                          {canComplete && (
                            <button
                              className="staff-icon-btn"
                              type="button"
                              title="Xác nhận hoàn thành"
                              disabled={completing === order.id}
                              onClick={() => quickCompleteOrder(order)}
                              style={{
                                background: "#dcfce7",
                                color: "#15803d",
                                border: "1.5px solid #bbf7d0",
                              }}
                            >
                              {completing === order.id ? (
                                <i
                                  className="bi bi-arrow-clockwise"
                                  style={{ animation: "spin 0.8s linear infinite" }}
                                />
                              ) : (
                                <i className="bi bi-check-circle-fill" />
                              )}
                            </button>
                          )}
                          <button
                            className="staff-icon-btn staff-icon-btn-success"
                            type="button"
                            title="Xem hoá đơn"
                            onClick={() => openInvoiceModal(order.id)}
                          >
                            <i className="bi bi-receipt" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center py-3 border-top bg-light">
              <Pagination className="mb-0">
                <Pagination.Prev
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                />
                {[...Array(totalPages)].map((_, i) => (
                  <Pagination.Item
                    key={i + 1}
                    active={i + 1 === currentPage}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* ── Modal: Tạo Counter Order ── */}
      <Modal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        size="lg"
        centered
      >
        <Form onSubmit={submitCreateCounterOrder}>
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="fw-bold">
              🛒 Tạo đơn tại quầy (Counter Order)
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="px-4">
            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Label className="fw-semibold">
                  Bàn <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  value={createForm.tableId}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, tableId: e.target.value }))
                  }
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
                <Form.Label className="fw-semibold">
                  Thời lượng (giờ)
                </Form.Label>
                <Form.Control
                  type="number"
                  min={1}
                  value={createForm.durationHours}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      durationHours: e.target.value,
                    }))
                  }
                />
              </Col>
              <Col md={3}>
                <Form.Label className="fw-semibold">Tên khách</Form.Label>
                <Form.Control
                  value={createForm.customerName}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      customerName: e.target.value,
                    }))
                  }
                  placeholder="Tên khách hàng"
                />
              </Col>
              <Col md={3}>
                <Form.Label className="fw-semibold">Số điện thoại</Form.Label>
                <Form.Control
                  value={createForm.customerPhone}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      customerPhone: e.target.value,
                    }))
                  }
                  placeholder="0912..."
                />
              </Col>
            </Row>

            <div
              className="d-flex justify-content-between align-items-center mb-3 px-2 py-2 rounded-3"
              style={{ background: "#f8fafc" }}
            >
              <h6 className="mb-0 fw-bold">🍽️ Danh sách món</h6>
              <Button
                variant="outline-primary"
                size="sm"
                type="button"
                className="rounded-3"
                onClick={addCreateItem}
              >
                <i className="bi bi-plus-lg me-1" />
                Thêm món
              </Button>
            </div>

            {createForm.items.map((item, index) => (
              <Row
                className="g-2 mb-2 align-items-center"
                key={`create-line-${index}`}
              >
                <Col md={6}>
                  <Form.Select
                    value={item.menuItemId}
                    onChange={(e) =>
                      onChangeCreateItem(index, "menuItemId", e.target.value)
                    }
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
                    onChange={(e) =>
                      onChangeCreateItem(index, "quantity", e.target.value)
                    }
                    required
                    placeholder="SL"
                  />
                </Col>
                <Col md={3}>
                  <Form.Control
                    value={item.note}
                    onChange={(e) =>
                      onChangeCreateItem(index, "note", e.target.value)
                    }
                    placeholder="Ghi chú (tuỳ chọn)"
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
          </Modal.Body>
          <Modal.Footer className="border-0 px-4 pb-4">
            <Button
              variant="outline-secondary"
              className="fw-semibold rounded-3"
              onClick={() => setShowCreateModal(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="fw-bold rounded-3"
              style={{ background: "#6366f1", border: "none" }}
              disabled={creating}
            >
              {creating ? (
                <>
                  <Spinner size="sm" className="me-1" />
                  Đang tạo...
                </>
              ) : (
                "✅ Tạo đơn"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Modal: Cập nhật Order ── */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
        centered
      >
        <Form onSubmit={submitUpdateOrder}>
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="fw-bold">
              ✏️ Cập nhật đơn —{" "}
              <span style={{ color: "#6366f1" }}>
                {editingOrder?.orderCode}
              </span>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="px-4">
            {/* Status selector */}
            <div className="mb-4">
              <Form.Label className="fw-bold mb-2">
                Trạng thái đơn hàng
              </Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {ORDER_STATUS_OPTIONS.map((s) => {
                  const ui = ORDER_STATUS_UI[s];
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
                      {active && (
                        <i
                          className="bi bi-check-circle-fill ms-1"
                          style={{ color: ui.color }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer info (read-only) */}
            {editingOrder && (
              <div
                className="rounded-3 p-3 mb-3"
                style={{ background: "#f8fafc", fontSize: "0.84rem" }}
              >
                <div className="d-flex gap-4 flex-wrap">
                  <div>
                    <span style={{ color: "#64748b" }}>👤 Khách: </span>
                    <strong>{editingOrder.customerName || "Khách lẻ"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>🪑 Bàn: </span>
                    <strong>{editingOrder.tableName || "--"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>💰 Tổng: </span>
                    <strong style={{ color: "#15803d" }}>
                      {fmtCur(editingOrder.totalAmount)}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            <div
              className="d-flex justify-content-between align-items-center mb-3 px-2 py-2 rounded-3"
              style={{ background: "#f8fafc" }}
            >
              <h6 className="mb-0 fw-bold">🍽️ Danh sách món</h6>
              <Button
                variant="outline-primary"
                size="sm"
                type="button"
                className="rounded-3"
                onClick={addEditItem}
              >
                <i className="bi bi-plus-lg me-1" />
                Thêm món
              </Button>
            </div>

            {editingItems.map((item, index) => (
              <Row
                className="g-2 mb-2 align-items-center"
                key={`edit-line-${index}`}
              >
                <Col md={6}>
                  <Form.Select
                    value={item.menuItemId}
                    onChange={(e) =>
                      onChangeEditItem(index, "menuItemId", e.target.value)
                    }
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
                    onChange={(e) =>
                      onChangeEditItem(index, "quantity", e.target.value)
                    }
                    required
                    placeholder="SL"
                  />
                </Col>
                <Col md={3}>
                  <Form.Control
                    value={item.note}
                    onChange={(e) =>
                      onChangeEditItem(index, "note", e.target.value)
                    }
                    placeholder="Ghi chú"
                  />
                </Col>
                <Col md={1}>
                  <Button
                    variant="outline-danger"
                    type="button"
                    className="w-100 rounded-3"
                    onClick={() => removeEditItem(index)}
                  >
                    <i className="bi bi-x-lg" />
                  </Button>
                </Col>
              </Row>
            ))}
          </Modal.Body>
          <Modal.Footer className="border-0 px-4 pb-4">
            <Button
              variant="outline-secondary"
              className="fw-semibold rounded-3"
              onClick={() => setShowEditModal(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="fw-bold rounded-3"
              style={{ background: "#6366f1", border: "none" }}
              disabled={updating}
            >
              {updating ? (
                <>
                  <Spinner size="sm" className="me-1" />
                  Đang lưu...
                </>
              ) : (
                "💾 Lưu thay đổi"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Modal: Hóa đơn ── */}
      <Modal
        show={showInvoiceModal}
        onHide={() => setShowInvoiceModal(false)}
        size="md"
        centered
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">🧾 Hóa đơn</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pb-2">
          {invoiceLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" style={{ color: "#6366f1" }} />
              <p className="mt-2 text-muted small fw-semibold">
                Đang tải hóa đơn...
              </p>
            </div>
          ) : !invoiceData ? (
            <Alert variant="secondary" className="mb-0">
              Không có dữ liệu hóa đơn.
            </Alert>
          ) : (
            <div>
              {/* Invoice header */}
              <div className="text-center mb-4">
                <div className="fw-bold fs-5" style={{ color: "#6366f1" }}>
                  {invoiceData.invoiceCode}
                </div>
                <div className="text-muted small">
                  {toDate(invoiceData.createdAt)} ·{" "}
                  {toTime(invoiceData.createdAt)}
                </div>
              </div>

              {/* Info */}
              <div
                className="rounded-3 p-3 mb-3"
                style={{ background: "#f8fafc", fontSize: "0.85rem" }}
              >
                {[
                  ["📋 Mã order", invoiceData.order?.orderCode],
                  ["👤 Khách hàng", invoiceData.customer?.name || "Khách lẻ"],
                  ["SĐT", invoiceData.customer?.phone || "--"],
                  ["🪑 Bàn", invoiceData.table?.name || "--"],
                ].map(([label, val]) => (
                  <div
                    key={label}
                    className="d-flex justify-content-between py-1 border-bottom"
                  >
                    <span style={{ color: "#64748b" }}>{label}</span>
                    <strong style={{ color: "#0f172a" }}>{val}</strong>
                  </div>
                ))}
              </div>

              {/* Items */}
              <h6 className="fw-bold mb-2">Danh sách món</h6>
              <div
                className="rounded-3 overflow-hidden mb-3"
                style={{ border: "1px solid #e2e8f0" }}
              >
                {(invoiceData.items || []).map((line, idx) => (
                  <div
                    key={`${line.menuName}-${idx}`}
                    className="d-flex justify-content-between align-items-center px-3 py-2"
                    style={{
                      borderBottom:
                        idx < invoiceData.items.length - 1
                          ? "1px solid #f1f5f9"
                          : "none",
                    }}
                  >
                    <div>
                      <div
                        className="fw-semibold"
                        style={{ fontSize: "0.87rem" }}
                      >
                        {line.menuName}
                      </div>
                      <div style={{ color: "#94a3b8", fontSize: "0.78rem" }}>
                        {fmtCur(line.priceAtOrder)} × {line.quantity}
                      </div>
                    </div>
                    <strong style={{ color: "#15803d" }}>
                      {fmtCur(line.lineTotal)}
                    </strong>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div
                className="rounded-3 p-3"
                style={{ background: "#f8fafc", fontSize: "0.88rem" }}
              >
                <div className="d-flex justify-content-between mb-2">
                  <span style={{ color: "#64748b" }}>Tạm tính dịch vụ</span>
                  <strong>{fmtCur(invoiceData.summary?.subTotal)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span style={{ color: "#64748b" }}>Đặt cọc booking</span>
                  <strong style={{ color: "#b91c1c" }}>
                    −{fmtCur(invoiceData.summary?.depositAmount)}
                  </strong>
                </div>
                <hr className="my-2" />
                <div className="d-flex justify-content-between">
                  <span className="fw-bold fs-6">Tổng cần thanh toán</span>
                  <strong className="fs-5" style={{ color: "#6366f1" }}>
                    {fmtCur(invoiceData.summary?.totalAmount)}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 px-4 pb-4 gap-2">
          <Button
            variant="outline-secondary"
            className="fw-semibold rounded-3"
            onClick={() => setShowInvoiceModal(false)}
          >
            Đóng
          </Button>
          <Button
            className="fw-bold rounded-3"
            style={{
              background: invoiceData ? "#6366f1" : "#94a3b8",
              border: "none",
            }}
            disabled={!invoiceData || exporting}
            onClick={handleExport}
          >
            {exporting ? (
              <>
                <Spinner size="sm" className="me-1" />
                Đang xuất...
              </>
            ) : (
              <>
                <i className="bi bi-download me-1" />
                Xuất hóa đơn (CSV)
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
}
