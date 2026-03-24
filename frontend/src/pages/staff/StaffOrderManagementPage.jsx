import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
} from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import EmptyState from "../../components/common/EmptyState";
import FilterBar from "../../components/common/FilterBar";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SearchInput from "../../components/common/SearchInput";
import CreateCounterOrderModal from "../../components/staff/CreateCounterOrderModal";
import EditOrderModal from "../../components/staff/EditOrderModal";
import InvoiceModal from "../../components/staff/InvoiceModal";
import PaymentModal from "../../components/staff/PaymentModal";
import StaffOrderTable from "../../components/staff/StaffOrderTable";
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
const ORDER_STATUS_OPTIONS = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "SERVED",
  "COMPLETED",
  "CANCELLED",
];

const ORDER_STATUS_UI = {
  PENDING:   { label: "Chờ xử lý", bg: "#fef9c3", color: "#92400e", icon: "bi-hourglass-split" },
  CONFIRMED: { label: "Đã xác nhận", bg: "#dbeafe", color: "#1d4ed8", icon: "bi-check-circle" },
  PREPARING: { label: "Đang chuẩn bị", bg: "#e0f2fe", color: "#0369a1", icon: "bi-fire" },
  SERVED:    { label: "Đã phục vụ", bg: "#dcfce7", color: "#15803d", icon: "bi-cup-hot" },
  COMPLETED: { label: "Hoàn tất", bg: "#bbf7d0", color: "#166534", icon: "bi-trophy" },
  CANCELLED: { label: "Đã hủy", bg: "#fee2e2", color: "#b91c1c", icon: "bi-x-circle" },
};

const STAT_GROUPS = [
  { key: "all", label: "Tất cả", icon: "bi-list-ul", bg: "#f1f5f9", color: "#475569" },
  { key: "PENDING", label: "Chờ xử lý", icon: "bi-hourglass-split", bg: "#fef9c3", color: "#92400e" },
  { key: "CONFIRMED", label: "Đã xác nhận", icon: "bi-check-circle", bg: "#dbeafe", color: "#1d4ed8" },
  { key: "PREPARING", label: "Đang chuẩn bị", icon: "bi-fire", bg: "#e0f2fe", color: "#0369a1" },
  { key: "SERVED", label: "Đã phục vụ", icon: "bi-cup-hot", bg: "#dcfce7", color: "#15803d" },
  { key: "COMPLETED", label: "Hoàn tất", icon: "bi-trophy", bg: "#bbf7d0", color: "#166534" },
  { key: "CANCELLED", label: "Đã hủy", icon: "bi-x-circle", bg: "#fee2e2", color: "#b91c1c" },
];

const ORDER_NEXT_STATUS = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "SERVED",
  SERVED: "COMPLETED",
};

function normalizeOrderStatus(rawStatus) {
  const status = String(rawStatus || "").trim().toUpperCase();
  if (!status) return "PENDING";
  if (status === "NEW") return "PENDING";
  if (status === "PAID") return "COMPLETED";
  if (status === "CANCELED") return "CANCELLED";
  if (ORDER_STATUS_OPTIONS.includes(status)) return status;
  return "PENDING";
}

function fmtCur(v) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(v || 0))}đ`;
}
function toTime(v) {
  if (!v) return "--";
  return new Date(v).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
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
  const [editingStatus, setEditingStatus] = useState("PENDING");
  const [editingItems, setEditingItems] = useState([createEmptyLine()]);
  const [updating, setUpdating] = useState(false);

  // Counter payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Invoice modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadPageData = async () => {
    setLoading(true);
    setError("");
    try {
      const [orderRows, tableRows, menuRows] = await Promise.all([
        getStaffOrders({ status: statusFilter === "all" ? "" : statusFilter, search, date: dateFilter }),
        getStaffTables({}),
        apiClient.get("/menu/items"),
      ]);
      const normalizedOrders = Array.isArray(orderRows)
        ? orderRows.map((order) => ({ ...order, status: normalizeOrderStatus(order?.status) }))
        : [];
      setOrders(normalizedOrders);
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
  }, [statusFilter, search, dateFilter]);

  const statCounts = useMemo(() => {
    const c = { all: orders.length };
    STAT_GROUPS.forEach((g) => {
      if (g.key !== "all") c[g.key] = orders.filter((o) => o.status === g.key).length;
    });
    return c;
  }, [orders]);

  const displayOrders = useMemo(() => {
    if (tableFilter === "all") return orders;
    return orders.filter((o) => String(o.tableId || "") === tableFilter);
  }, [orders, tableFilter]);

  const onChangeCreateItem = (i, k, v) =>
    setCreateForm((p) => ({ ...p, items: p.items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)) }));
  const addCreateItem = () =>
    setCreateForm((p) => ({ ...p, items: [...p.items, createEmptyLine()] }));
  const removeCreateItem = (i) =>
    setCreateForm((p) => ({ ...p, items: p.items.length <= 1 ? p.items : p.items.filter((_, idx) => idx !== i) }));

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
      setCreateForm({ tableId: "", customerName: "", customerPhone: "", durationHours: 2, items: [createEmptyLine()] });

      const bookingAmt = result.bookingAmount || 0;
      const orderAmt = result.orderAmount || 0;
      const totalAmt = result.totalAmount || 0;

      let message = "✅ Tạo đơn counter thành công!";
      if (totalAmt > 0) {
        message += `\n💰 Tiền thuê bàn: ${bookingAmt.toLocaleString()}đ`;
        if (orderAmt > 0) {
          message += `\n🍽️ Tiền order: ${orderAmt.toLocaleString()}đ`;
        }
        message += `\n📊 Tổng: ${totalAmt.toLocaleString()}đ`;
      }

      setSuccessMsg(message);

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
    setEditingStatus(normalizeOrderStatus(order.status));
    setEditingItems(
      (order.items || []).length
        ? order.items.map((it) => ({ menuItemId: String(it.menuItemId || ""), quantity: Number(it.quantity || 1), note: it.note || "" }))
        : [createEmptyLine()],
    );
    setShowEditModal(true);
    setError("");
  };

  const onChangeEditItem = (i, k, v) =>
    setEditingItems((p) => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const addEditItem    = () => setEditingItems((p) => [...p, createEmptyLine()]);
  const removeEditItem = (i) =>
    setEditingItems((p) => p.length <= 1 ? p : p.filter((_, idx) => idx !== i));

  const submitUpdateOrder = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    setUpdating(true);
    setError("");
    try {
      await updateStaffOrder(editingOrder.id, { status: editingStatus, items: editingItems });
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
      const nextStatus = ORDER_NEXT_STATUS[order.status];
      if (!nextStatus) {
        setSuccessMsg(`Đơn ${order.orderCode} đã ở trạng thái cuối hoặc không hợp lệ.`);
        return;
      }

      await updateStaffOrder(order.id, {
        status: nextStatus,
        items: (order.items || []).map((it) => ({
          menuItemId: String(it.menuItemId || ""),
          quantity: Number(it.quantity || 1),
          note: it.note || "",
        })),
      });
      setSuccessMsg(`✅ Đơn ${order.orderCode} đã chuyển sang ${nextStatus}!`);
      await loadPageData();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.message || "Không thể hoàn thành đơn.");
    } finally {
      setCompleting(null);
    }
  };

  // ── Counter payment ─────────────────────────────────────────────────────────
  const openPaymentModal = (order) => {
    setPaymentOrder(order);
    setPaymentMethod("CASH");
    setShowPaymentModal(true);
    setError("");
  };

  const handleProcessPayment = async () => {
    if (!paymentOrder?.id || processingPayment) return;

    setProcessingPayment(true);
    setError("");
    try {
      const data = await processCounterPayment(paymentOrder.id, paymentMethod);

      if (paymentMethod === "QR_PAYOS") {
        const checkoutUrl = data?.checkoutUrl || data?.payment?.payos?.checkoutUrl;
        if (checkoutUrl) {
          window.open(checkoutUrl, "_blank");
        }
        setSuccessMsg("✅ Đã tạo QR PayOS cho đơn tại quầy.");
      } else {
        setSuccessMsg("✅ Thanh toán tại quầy thành công!");
      }

      await loadPageData();
      setShowPaymentModal(false);
      setPaymentOrder(null);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.message || "Thanh toán tại quầy thất bại.");
    } finally {
      setProcessingPayment(false);
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
        <Alert className="border-0 rounded-3 mb-3" style={{ background: "#dcfce7", color: "#15803d" }}>
          {successMsg}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" className="rounded-3 mb-3" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Stat chips */}
      <div className="row g-3 mb-4">
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
                  boxShadow: active ? `0 4px 16px ${g.color}22` : "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 38, height: 38, background: g.bg, fontSize: 16, color: g.color }}
                >
                  <i className={`bi ${g.icon}`} />
                </div>
                <div>
                  <div className="fw-bold lh-1" style={{ color: g.color, fontSize: "1.2rem" }}>
                    {statCounts[g.key] ?? 0}
                  </div>
                  <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 600 }}>{g.label}</div>
                </div>
                {active && <i className="bi bi-funnel-fill ms-auto" style={{ color: g.color, fontSize: "0.7rem" }} />}
              </div>
            </Col>
          );
        })}
      </div>

      {/* Filters */}
      <FilterBar>
        <Col md={3}>
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã đơn, tên khách..."
          />
        </Col>
        <Col md={2}>
          <Form.Control type="date" className="staff-filter-control" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </Col>
        <Col md={3}>
          <Form.Select className="staff-filter-control" value={tableFilter} onChange={(e) => setTableFilter(e.target.value)}>
            <option value="all">Tất cả chỗ ngồi</option>
            {tables.map((t) => (
              <option key={String(t.id)} value={String(t.id)}>{t.name}</option>
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
      </FilterBar>

      {/* Order table */}
      <Card className="border-0 shadow-sm staff-panel-card">
        <Card.Body className="p-0">
          {loading ? (
            <LoadingSpinner text="Đang tải đơn hàng..." color="#6366f1" />
          ) : displayOrders.length === 0 ? (
            <EmptyState icon="📦" title="Không có đơn hàng phù hợp" />
          ) : (
            <StaffOrderTable
              orders={displayOrders}
              onEdit={openEditOrder}
              onPay={openPaymentModal}
              onStatusChange={quickCompleteOrder}
              onViewInvoice={openInvoiceModal}
              completing={completing}
              fmtCur={fmtCur}
              toTime={toTime}
              toDate={toDate}
            />
          )}
        </Card.Body>
      </Card>

      <CreateCounterOrderModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={submitCreateCounterOrder}
        creating={creating}
        createForm={createForm}
        setCreateForm={setCreateForm}
        tables={tables}
        menuItems={menuItems}
        onChangeCreateItem={onChangeCreateItem}
        addCreateItem={addCreateItem}
        removeCreateItem={removeCreateItem}
        fmtCur={fmtCur}
      />

      <EditOrderModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={submitUpdateOrder}
        editingOrder={editingOrder}
        editingStatus={editingStatus}
        setEditingStatus={setEditingStatus}
        editingItems={editingItems}
        onChangeEditItem={onChangeEditItem}
        addEditItem={addEditItem}
        removeEditItem={removeEditItem}
        menuItems={menuItems}
        fmtCur={fmtCur}
        updating={updating}
        statusOptions={ORDER_STATUS_OPTIONS}
        statusUi={ORDER_STATUS_UI}
      />

      <PaymentModal
        show={showPaymentModal}
        onClose={() => {
          if (processingPayment) return;
          setShowPaymentModal(false);
          setPaymentOrder(null);
        }}
        onConfirm={handleProcessPayment}
        order={paymentOrder}
        method={paymentMethod}
        setMethod={setPaymentMethod}
        loading={processingPayment}
        fmtCur={fmtCur}
      />

      <InvoiceModal
        show={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        invoiceLoading={invoiceLoading}
        invoiceData={invoiceData}
        toDate={toDate}
        toTime={toTime}
        fmtCur={fmtCur}
        exporting={exporting}
        onExport={handleExport}
      />
    </AdminLayout>
  );
}
