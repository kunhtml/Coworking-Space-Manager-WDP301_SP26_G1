import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
} from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import { apiClient } from "../../services/api";
import {
  createCounterOrder,
  getStaffTables,
} from "../../services/staffDashboardService";
import { processCounterPayment } from "../../services/staffPaymentService";
import SeatZoneSection from "../../components/staff/SeatZoneSection";

// ── Table status config ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
  Available:   { label: "Trống",         bg: "#dcfce7", color: "#16a34a", border: "#10b981", emoji: "✅" },
  Occupied:    { label: "Đang sử dụng", bg: "#fee2e2", color: "#dc2626", border: "#ef4444", emoji: "🔴" },
  Reserved:    { label: "Đã đặt trước", bg: "#fef9c3", color: "#ca8a04", border: "#f59e0b", emoji: "📌" },
  Cleaning:    { label: "Đang dọn",     bg: "#dbeafe", color: "#1d4ed8", border: "#3b82f6", emoji: "🧹" },
  Maintenance: { label: "Bảo trì",      bg: "#f1f5f9", color: "#64748b", border: "#94a3b8", emoji: "🔧" },
};

function getCfg(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.Available;
}

function fmtCur(v) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(v || 0))}đ`;
}

function normalizeMenuStatus(item) {
  const availability = String(item?.availabilityStatus || "").trim().toUpperCase();
  const stock = Number(item?.stockQuantity || 0);
  if (["OUT_OF_STOCK", "UNAVAILABLE", "OUTOFSTOCK"].includes(availability)) return "OUT_OF_STOCK";
  if (["IN_STOCK", "AVAILABLE"].includes(availability)) return stock > 0 ? "AVAILABLE" : "OUT_OF_STOCK";
  return stock > 0 ? "AVAILABLE" : "OUT_OF_STOCK";
}

function getSeatIcon(type) {
  if (!type) return "bi-shop";
  const t = type.toLowerCase();
  if (t.includes("vip") || t.includes("phòng") || t.includes("private")) return "bi-door-closed";
  if (t.includes("nhóm") || t.includes("group")) return "bi-people";
  if (t.includes("họp") || t.includes("meeting")) return "bi-camera-video";
  return "bi-person-workspace";
}

// ── Booking Status Labels ──
const BOOKING_STATUS_LABEL = {
  Pending: "Chờ thanh toán",
  Awaiting_Payment: "Chờ thanh toán",
  Confirmed: "Đã xác nhận",
  CheckedIn: "Đã check-in",
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
};

function formatTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function StaffPOSPage() {
  const [searchParams] = useSearchParams();
  const urlTableId = searchParams.get("tableId");
  const preselectedRef = useRef(false);

  // ── Tables ──
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [tableSearch, setTableSearch] = useState("");
  const [tableStatusFilter, setTableStatusFilter] = useState("all");
  const [tableTypeFilter, setTableTypeFilter] = useState("all");
  const [loadingTables, setLoadingTables] = useState(true);

  // ── Menu ──
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [menuStockFilter, setMenuStockFilter] = useState("all");
  const [menuSearch, setMenuSearch] = useState("");

  // ── Cart & Order ──
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [durationHours, setDurationHours] = useState(2);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── Load data ──
  const fetchTables = useCallback(async () => {
    try {
      setLoadingTables(true);
      const data = await getStaffTables();
      setTables(Array.isArray(data) ? data : []);
    } catch {
      /* ignore */
    } finally {
      setLoadingTables(false);
    }
  }, []);

  const fetchMenu = useCallback(async () => {
    try {
      const [menuRows, catRows] = await Promise.all([
        apiClient.get("/menu/items?admin=true"),
        apiClient.get("/menu/categories"),
      ]);
      setMenuItems(Array.isArray(menuRows) ? menuRows : []);
      setCategories(Array.isArray(catRows) ? catRows : []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchTables();
    fetchMenu();
    const interval = setInterval(fetchTables, 30_000);
    return () => clearInterval(interval);
  }, [fetchTables, fetchMenu]);

  // Auto-select table from URL param after tables load
  useEffect(() => {
    if (urlTableId && tables.length > 0 && !preselectedRef.current) {
      const match = tables.find((t) => String(t.id || t._id) === urlTableId);
      if (match) {
        setSelectedTable(match);
        preselectedRef.current = true;
      }
    }
  }, [urlTableId, tables]);

  // ── Table filtering ──
  const displayedTables = useMemo(() => {
    let rows = tables;
    if (tableStatusFilter !== "all") rows = rows.filter((t) => t.status === tableStatusFilter);
    if (tableTypeFilter !== "all") rows = rows.filter((t) => (t.tableType || "") === tableTypeFilter);
    if (tableSearch.trim()) {
      const q = tableSearch.trim().toLowerCase();
      rows = rows.filter((t) =>
        (t.name || "").toLowerCase().includes(q) || (t.tableType || "").toLowerCase().includes(q),
      );
    }
    return rows;
  }, [tables, tableStatusFilter, tableTypeFilter, tableSearch]);

  // ── Unique table types ──
  const tableTypes = useMemo(() => {
    const types = [...new Set(tables.map((t) => t.tableType || "").filter(Boolean))];
    return types.sort();
  }, [tables]);

  // ── Table stats ──
  const tableStats = useMemo(() => {
    const s = { total: tables.length };
    Object.keys(STATUS_CONFIG).forEach((k) => {
      s[k] = tables.filter((t) => t.status === k).length;
    });
    return s;
  }, [tables]);

  // ── Menu filtering ──
  const availableMenu = useMemo(() => {
    let items = menuItems; // Start with all items
    if (selectedCategory !== "all") {
      items = items.filter((item) => {
        const catId = String(item?.categoryId?._id || item?.categoryId || "");
        return catId === selectedCategory;
      });
    }
    if (menuStockFilter !== "all") {
      items = items.filter((item) => {
        const isAvailable = normalizeMenuStatus(item) === "AVAILABLE";
        if (menuStockFilter === "AVAILABLE") return isAvailable;
        if (menuStockFilter === "OUT_OF_STOCK") return !isAvailable;
        return true;
      });
    }
    if (menuSearch.trim()) {
      const q = menuSearch.trim().toLowerCase();
      items = items.filter((item) =>
        (item.name || "").toLowerCase().includes(q) || (item.description || "").toLowerCase().includes(q),
      );
    }
    return items;
  }, [menuItems, selectedCategory, menuSearch, menuStockFilter]);

  // ── Cart logic ──
  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [cart],
  );

  const addToCart = (menuItem) => {
    setCart((prev) => {
      const found = prev.find((item) => String(item.menuItemId) === String(menuItem._id));
      if (found) {
        return prev.map((item) =>
          String(item.menuItemId) === String(menuItem._id)
            ? { ...item, quantity: Number(item.quantity || 0) + 1 }
            : item,
        );
      }
      return [...prev, { menuItemId: menuItem._id, name: menuItem.name, price: Number(menuItem.price || 0), quantity: 1 }];
    });
  };

  const updateQty = (menuItemId, qty) => {
    const nextQty = Number(qty || 0);
    if (nextQty <= 0) {
      setCart((prev) => prev.filter((item) => String(item.menuItemId) !== String(menuItemId)));
      return;
    }
    setCart((prev) =>
      prev.map((item) => (String(item.menuItemId) === String(menuItemId) ? { ...item, quantity: nextQty } : item)),
    );
  };

  const removeFromCart = (menuItemId) => {
    setCart((prev) => prev.filter((item) => String(item.menuItemId) !== String(menuItemId)));
  };

  // ── Submit order ──
  const submitOrder = async (payMethod) => {
    if (!selectedTable && !cart.length) {
      setError("Vui lòng chọn bàn hoặc thêm món vào hoá đơn."); return;
    }

    setCreating(true);
    setError("");
    try {
      const orderItems = cart.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: Number(item.quantity || 0),
        note: "",
      }));

      const payload = {
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        items: orderItems.length > 0 ? orderItems : undefined,
      };
      if (selectedTable) {
        payload.tableId = selectedTable.id || selectedTable._id;
        payload.durationHours = Number(durationHours || 2);
      }

      const result = await createCounterOrder(payload);

      const orderId = result.orderId;
      const totalAmt = result.totalAmount || 0;

      // Process payment based on method
      if (payMethod === "CASH" && orderId) {
        try {
          await processCounterPayment(orderId, "CASH");
          setSuccess(`✅ Thanh toán tiền mặt thành công: ${result.orderCode} — ${fmtCur(totalAmt)}`);
        } catch (payErr) {
          setSuccess(`✅ Tạo đơn thành công: ${result.orderCode}. Lỗi thanh toán: ${payErr.message}`);
        }
      } else if (payMethod === "QR_PAYOS" && orderId) {
        try {
          const payResult = await processCounterPayment(orderId, "QR_PAYOS");
          const checkoutUrl = payResult.checkoutUrl || payResult.payment?.payos?.checkoutUrl;
          if (checkoutUrl) {
            window.open(checkoutUrl, "_blank");
          }
          setSuccess(`✅ Tạo đơn thành công: ${result.orderCode} — Đang chờ thanh toán QR`);
        } catch (payErr) {
          // Fallback: try checkout URL from createCounterOrder result
          if (result.payment?.checkoutUrl) {
            window.open(result.payment.checkoutUrl, "_blank");
          }
          setSuccess(`✅ Tạo đơn: ${result.orderCode}. Mở link thanh toán QR...`);
        }
      } else {
        setSuccess(`✅ Tạo đơn thành công: ${result.orderCode} — ${fmtCur(totalAmt)}`);
      }

      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      fetchTables();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.message || "Tạo đơn thất bại.");
    } finally {
      setCreating(false);
    }
  };

  // ── Render ──
  return (
    <AdminLayout>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-shop me-2" style={{ color: "#6366f1" }} />
            POS — Tạo đơn tại quầy
          </h2>
          <p className="text-secondary fw-semibold small mb-0">
            Chọn bàn → chọn dịch vụ → tạo đơn
          </p>
        </div>
        <Button
          variant="outline-secondary"
          className="fw-semibold rounded-3 d-flex align-items-center gap-2"
          style={{ border: "1.5px solid #cbd5e1", padding: "8px 18px" }}
          onClick={() => { fetchTables(); fetchMenu(); }}
          disabled={loadingTables}
        >
          <i className="bi bi-arrow-clockwise" />
          {loadingTables ? "Đang tải..." : "Làm mới"}
        </Button>
      </div>

      {/* Alerts */}
      {success && (
        <Alert className="border-0 rounded-3 mb-3" style={{ background: "#dcfce7", color: "#15803d" }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" className="rounded-3 mb-3" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Row className="g-3">
        {/* ════════  LEFT: Seat Map  ════════ */}
        <Col lg={5} xl={4}>
          <Card className="border-0 shadow-sm" style={{ borderRadius: 16 }}>
            <Card.Header className="bg-white border-bottom d-flex align-items-center justify-content-between py-3" style={{ borderRadius: "16px 16px 0 0" }}>
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-grid-3x3-gap me-2 text-primary" />Sơ đồ chỗ ngồi
              </h5>
              <small className="text-muted fw-semibold">{tableStats.total} bàn</small>
            </Card.Header>

            {/* Mini stat chips */}
            <div className="px-3 pt-3">
              <div className="d-flex flex-wrap gap-2 mb-2">
                {[
                  { key: "all", label: "Tất cả", count: tableStats.total, bg: "#f1f5f9", color: "#475569" },
                  ...Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
                    key, label: cfg.label, count: tableStats[key] || 0, bg: cfg.bg, color: cfg.color,
                  })),
                ].map((s) => (
                  <span
                    key={s.key}
                    className="rounded-pill px-2 py-1 fw-bold d-inline-flex align-items-center gap-1"
                    style={{
                      background: tableStatusFilter === s.key ? s.bg : "#f8fafc",
                      color: s.color,
                      fontSize: "0.7rem",
                      cursor: "pointer",
                      border: `1.5px solid ${tableStatusFilter === s.key ? s.color : "#e2e8f0"}`,
                      transition: "all 0.15s",
                    }}
                    onClick={() => setTableStatusFilter(s.key)}
                  >
                    {s.label} <strong>{s.count}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="px-3 pt-1 pb-2 border-bottom">
              <Row className="g-2">
                <Col xs={6}>
                  <Form.Select
                    size="sm"
                    className="staff-filter-control"
                    value={tableTypeFilter}
                    onChange={(e) => setTableTypeFilter(e.target.value)}
                  >
                    <option value="all">Tất cả loại bàn</option>
                    {tableTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col xs={6}>
                  <div className="staff-search-wrap" style={{ borderRadius: 6, padding: "2px 8px" }}>
                    <i className="bi bi-search" style={{ fontSize: "0.8rem" }} />
                    <input
                      style={{ fontSize: "0.8rem" }}
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      placeholder="Tìm bàn..."
                    />
                  </div>
                </Col>
              </Row>
            </div>

            {/* Table grid */}
            <Card.Body className="p-3" style={{ maxHeight: "calc(100vh - 380px)", overflowY: "auto", background: "#f8fafc" }}>
              {loadingTables ? (
                <div className="text-center py-4">
                  <Spinner animation="border" size="sm" style={{ color: "#6366f1" }} />
                </div>
              ) : displayedTables.length === 0 ? (
                <div className="text-center py-4 text-muted small fw-semibold">Không có bàn phù hợp</div>
              ) : (
                (() => {
                  const groupedMap = {};
                  displayedTables.forEach((t) => {
                    const c = t.tableType || "Khác";
                    if (!groupedMap[c]) groupedMap[c] = [];
                    groupedMap[c].push(t);
                  });
                  const zoneNames = Object.keys(groupedMap).sort();
                  return zoneNames.map((zone) => (
                    <SeatZoneSection
                      key={zone}
                      zone={zone}
                      tables={groupedMap[zone]}
                      getCfg={getCfg}
                      hoveredId={hoveredId}
                      setHoveredId={setHoveredId}
                      onOpen={(t) => setSelectedTable(selectedTable && (selectedTable.id || selectedTable._id) === (t.id || t._id) ? null : t)}
                      getSeatIcon={getSeatIcon}
                      formatTime={formatTime}
                      bookingStatusLabel={BOOKING_STATUS_LABEL}
                      colProps={{ xs: 6, xl: 6 }}
                    />
                  ));
                })()
              )}
            </Card.Body>
          </Card>

          {/* Selected table info */}
          {selectedTable && (
            <Card className="border-0 shadow-sm mt-3" style={{ borderRadius: 16, borderLeft: "4px solid #6366f1" }}>
              <Card.Body className="py-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold mb-0">
                    <i className="bi bi-pin-map me-1 text-primary" />{selectedTable.name}
                  </h6>
                  <Badge className="rounded-pill" style={{ background: getCfg(selectedTable.status).bg, color: getCfg(selectedTable.status).color, border: "none" }}>
                    {getCfg(selectedTable.status).emoji} {getCfg(selectedTable.status).label}
                  </Badge>
                </div>
                <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                  {selectedTable.tableType} · {selectedTable.capacity} chỗ · {fmtCur(selectedTable.pricePerHour)}/h
                </div>
                <Row className="g-2 mt-2">
                  <Col xs={6}>
                    <Form.Control
                      size="sm"
                      placeholder="Tên khách"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </Col>
                  <Col xs={6}>
                    <Form.Control
                      size="sm"
                      placeholder="SĐT khách"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </Col>
                  <Col xs={6}>
                    <Form.Control
                      size="sm"
                      type="number"
                      min={1}
                      placeholder="Giờ"
                      value={durationHours}
                      onChange={(e) => setDurationHours(e.target.value)}
                    />
                  </Col>
                  <Col xs={6}>
                    <div className="fw-bold text-end" style={{ color: "#6366f1", fontSize: "0.85rem", lineHeight: "31px" }}>
                      Thuê: {fmtCur(Number(selectedTable.pricePerHour || 0) * Number(durationHours || 0))}
                    </div>
                  </Col>
                </Row>

                {/* Upcoming bookings timeline */}
                {selectedTable.upcomingBookings && selectedTable.upcomingBookings.length > 0 && (
                  <div className="mt-3 pt-2 border-top">
                    <div className="fw-bold mb-2" style={{ fontSize: "0.76rem", color: "#64748b" }}>
                      <i className="bi bi-calendar-event me-1" />Lịch đặt sắp tới ({selectedTable.upcomingBookings.length})
                    </div>
                    {selectedTable.upcomingBookings.map((b) => {
                      const start = new Date(b.startTime);
                      const end = new Date(b.endTime);
                      const fmtT = (d) => d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                      const fmtD = (d) => d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
                      const isNow = start <= new Date() && end >= new Date();
                      return (
                        <div
                          key={String(b.id)}
                          className="d-flex align-items-center gap-2 mb-1 rounded-2 px-2 py-1"
                          style={{
                            background: isNow ? "#fef2f2" : "#f8fafc",
                            border: isNow ? "1px solid #fca5a5" : "1px solid #e2e8f0",
                            fontSize: "0.72rem",
                          }}
                        >
                          <span style={{ color: isNow ? "#dc2626" : "#6366f1", fontWeight: 700, minWidth: 85 }}>
                            {fmtT(start)} – {fmtT(end)}
                          </span>
                          <span className="text-muted" style={{ fontSize: "0.65rem" }}>{fmtD(start)}</span>
                          <span
                            className="rounded-pill px-2 ms-auto fw-bold"
                            style={{
                              fontSize: "0.6rem",
                              background: isNow ? "#fee2e2" : "#dbeafe",
                              color: isNow ? "#dc2626" : "#1d4ed8",
                            }}
                          >
                            {isNow ? "Đang dùng" : b.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* No upcoming bookings */}
                {(!selectedTable.upcomingBookings || selectedTable.upcomingBookings.length === 0) && (
                  <div className="mt-2 pt-2 border-top text-center" style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 600 }}>
                    <i className="bi bi-check-circle me-1" />Không có lịch đặt — bàn trống hoàn toàn
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* ════════  RIGHT: Menu + Cart  ════════ */}
        <Col lg={7} xl={8}>
          <Row className="g-3">
            {/* Menu items */}
            <Col xl={8}>
              <Card className="border-0 shadow-sm" style={{ borderRadius: 16 }}>
                <Card.Header className="bg-white border-bottom py-3" style={{ borderRadius: "16px 16px 0 0" }}>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h5 className="mb-0 fw-bold">
                      <i className="bi bi-cup-hot me-2 text-success" />Dịch vụ & Thực đơn
                    </h5>
                    <small className="text-muted fw-semibold">{availableMenu.length} món</small>
                  </div>
                  {/* Category & Stock filters */}
                  <div className="px-1 mt-3">
                    <Row className="g-2">
                      <Col xs={4}>
                        <Form.Select
                          size="sm"
                          className="staff-filter-control"
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                          <option value="all">Tất cả danh mục</option>
                          {categories.map((cat) => (
                            <option key={String(cat._id)} value={String(cat._id)}>
                              {cat.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col xs={4}>
                        <Form.Select
                          size="sm"
                          className="staff-filter-control"
                          value={menuStockFilter}
                          onChange={(e) => setMenuStockFilter(e.target.value)}
                        >
                          <option value="all">Mọi trạng thái</option>
                          <option value="AVAILABLE">Còn hàng</option>
                          <option value="OUT_OF_STOCK">Tạm hết</option>
                        </Form.Select>
                      </Col>
                      <Col xs={4}>
                        <div className="staff-search-wrap" style={{ borderRadius: 6, padding: "2px 8px" }}>
                          <i className="bi bi-search" style={{ fontSize: "0.8rem" }} />
                          <input
                            style={{ fontSize: "0.8rem" }}
                            value={menuSearch}
                            onChange={(e) => setMenuSearch(e.target.value)}
                            placeholder="Tìm món..."
                          />
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Card.Header>
                <Card.Body style={{ maxHeight: "calc(100vh - 340px)", overflowY: "auto" }}>
                  <Row className="g-2">
                    {availableMenu.map((item) => (
                      <Col md={6} xl={4} key={String(item._id)}>
                        <div
                          className="rounded-3 p-2 h-100 d-flex flex-column"
                          style={{
                            background: "#fff",
                            border: "1.5px solid #e2e8f0",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                          onClick={() => addToCart(item)}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(99,102,241,0.12)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
                        >
                          <div className="fw-bold" style={{ fontSize: "0.85rem", color: "#0f172a" }}>{item.name}</div>
                          <div className="text-muted" style={{ fontSize: "0.72rem", flex: 1 }}>{item.description || "--"}</div>
                          <div className="d-flex justify-content-between align-items-center mt-1">
                            <span className="fw-bold" style={{ color: "#15803d", fontSize: "0.85rem" }}>{fmtCur(item.price)}</span>
                            <div className="d-flex align-items-center gap-1">
                              <span className="rounded-pill px-2" style={{ background: "#fef9c3", color: "#92400e", fontSize: "0.62rem", fontWeight: 700 }}>
                                Còn: {Number(item.stockQuantity || 0)}
                              </span>
                              <span className="rounded-pill px-2" style={{ background: "#eef2ff", color: "#6366f1", fontSize: "0.68rem", fontWeight: 700 }}>
                                <i className="bi bi-plus" /> Thêm
                              </span>
                            </div>
                          </div>
                        </div>
                      </Col>
                    ))}
                    {availableMenu.length === 0 && (
                      <div className="text-center py-4 text-muted small fw-semibold">Không có món phù hợp</div>
                    )}
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            {/* Hoá đơn */}
            <Col xl={4}>
              <Card className="border-0 shadow-sm" style={{ borderRadius: 16, position: "sticky", top: 16 }}>
                <Card.Header className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center" style={{ borderRadius: "16px 16px 0 0" }}>
                  <h5 className="mb-0 fw-bold">
                    <i className="bi bi-receipt me-2" style={{ color: "#6366f1" }} />Hoá đơn
                  </h5>
                  {selectedTable ? (
                    <Badge pill style={{ background: "#6366f1", border: "none", fontSize: "0.78rem" }}>
                      {selectedTable.name}
                    </Badge>
                  ) : cart.length > 0 ? (
                    <Badge pill style={{ background: "#f59e0b", border: "none", fontSize: "0.78rem" }}>
                      Mua mang đi
                    </Badge>
                  ) : null}
                </Card.Header>
                <Card.Body style={{ maxHeight: "calc(100vh - 420px)", overflowY: "auto" }}>
                  {!selectedTable && cart.length === 0 ? (
                    <div className="text-center py-4">
                      <div style={{ fontSize: 36 }}>📋</div>
                      <div className="text-muted fw-semibold small mt-1">Hoá đơn trống</div>
                      <div className="text-muted" style={{ fontSize: "0.72rem" }}>Chọn bàn hoặc thêm món từ menu</div>
                    </div>
                  ) : (
                    <>
                      {/* Table rental line (only if table selected) */}
                      {selectedTable && (
                        <div className="mb-2 pb-2 border-bottom">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="fw-bold d-flex align-items-center" style={{ fontSize: "0.84rem", color: "#6366f1" }}>
                                <i className="bi bi-building me-2" />{selectedTable.name}
                                <button
                                  type="button"
                                  className="btn btn-sm p-0 ms-2"
                                  style={{ color: "#ef4444", fontSize: "0.78rem" }}
                                  onClick={() => setSelectedTable(null)}
                                >
                                  <i className="bi bi-x-lg" />
                                </button>
                              </div>
                              <div className="d-flex align-items-center gap-2 mt-1">
                                <span className="text-muted" style={{ fontSize: "0.72rem" }}>
                                  {selectedTable.tableType} · {fmtCur(selectedTable.pricePerHour)}/h
                                </span>
                                <div className="d-flex align-items-center rounded" style={{ background: "#f8fafc", border: "1px solid #cbd5e1" }}>
                                  <button
                                    className="btn btn-sm p-0 text-secondary d-flex align-items-center justify-content-center hover-bg-light"
                                    style={{ width: 24, height: 24 }}
                                    onClick={() => setDurationHours(Math.max(1, durationHours - 1))}
                                  >
                                    <i className="bi bi-dash" />
                                  </button>
                                  <div className="fw-bold text-center" style={{ fontSize: "0.75rem", width: 20, color: "#334155" }}>
                                    {durationHours}
                                  </div>
                                  <button
                                    className="btn btn-sm p-0 text-secondary d-flex align-items-center justify-content-center hover-bg-light"
                                    style={{ width: 24, height: 24 }}
                                    onClick={() => setDurationHours(durationHours + 1)}
                                  >
                                    <i className="bi bi-plus" />
                                  </button>
                                </div>
                                <span className="text-muted fw-semibold" style={{ fontSize: "0.72rem" }}>giờ</span>
                              </div>
                            </div>
                            <span className="fw-bold" style={{ color: "#15803d", fontSize: "0.85rem" }}>
                              {fmtCur(Number(selectedTable.pricePerHour || 0) * Number(durationHours || 0))}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Menu items */}
                      {cart.length > 0 && (
                        <div className="mb-1" style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Dịch vụ & Thực đơn
                        </div>
                      )}
                      {cart.map((item) => (
                        <div key={String(item.menuItemId)} className="mb-2 pb-2 border-bottom">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="fw-semibold" style={{ fontSize: "0.84rem" }}>{item.name}</div>
                            <button
                              type="button"
                              className="btn btn-sm p-0"
                              style={{ color: "#ef4444", fontSize: "0.78rem" }}
                              onClick={() => removeFromCart(item.menuItemId)}
                            >
                              <i className="bi bi-x-lg" />
                            </button>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-1">
                            <div className="d-flex align-items-center gap-1">
                              <button
                                type="button"
                                className="btn btn-sm rounded-circle"
                                style={{ width: 26, height: 26, background: "#f1f5f9", border: "none", fontSize: "0.72rem", fontWeight: 700 }}
                                onClick={() => updateQty(item.menuItemId, item.quantity - 1)}
                              >
                                −
                              </button>
                              <span className="fw-bold px-1" style={{ fontSize: "0.85rem", minWidth: 20, textAlign: "center" }}>
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                className="btn btn-sm rounded-circle"
                                style={{ width: 26, height: 26, background: "#eef2ff", border: "none", color: "#6366f1", fontSize: "0.72rem", fontWeight: 700 }}
                                onClick={() => updateQty(item.menuItemId, item.quantity + 1)}
                              >
                                +
                              </button>
                            </div>
                            <span className="fw-bold" style={{ color: "#15803d", fontSize: "0.82rem" }}>
                              {fmtCur(Number(item.price || 0) * Number(item.quantity || 0))}
                            </span>
                          </div>
                        </div>
                      ))}

                      {selectedTable && cart.length === 0 && (
                        <div className="text-center py-2 text-muted" style={{ fontSize: "0.72rem" }}>
                          <i className="bi bi-cup-hot me-1" />(Tuỳ chọn) Thêm đồ ăn/uống từ menu
                        </div>
                      )}
                    </>
                  )}
                </Card.Body>

                {/* Invoice footer */}
                <div className="px-3 pb-3">
                  {(selectedTable || cart.length > 0) && (
                    <>
                      <div className="rounded-3 p-2 mb-2" style={{ background: "#f8fafc", fontSize: "0.8rem" }}>
                        {selectedTable && (
                          <div className="d-flex justify-content-between">
                            <span style={{ color: "#64748b" }}>Thuê bàn ({durationHours}h)</span>
                            <strong>{fmtCur(Number(selectedTable.pricePerHour || 0) * Number(durationHours || 0))}</strong>
                          </div>
                        )}
                        {cartTotal > 0 && (
                          <div className="d-flex justify-content-between">
                            <span style={{ color: "#64748b" }}>Dịch vụ</span>
                            <strong>{fmtCur(cartTotal)}</strong>
                          </div>
                        )}
                        <hr className="my-1" />
                        <div className="d-flex justify-content-between">
                          <strong>Tổng cộng</strong>
                          <strong style={{ color: "#6366f1", fontSize: "1.1rem" }}>
                            {fmtCur(cartTotal + (selectedTable ? Number(selectedTable.pricePerHour || 0) * Number(durationHours || 0) : 0))}
                          </strong>
                        </div>
                      </div>

                      {/* Payment buttons */}
                      <div className="d-flex gap-2">
                        <Button
                          className="flex-grow-1 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-1"
                          style={{
                            background: "#16a34a",
                            border: "none",
                            padding: "10px 0",
                            fontSize: "0.85rem",
                          }}
                          disabled={creating}
                          onClick={() => submitOrder("CASH")}
                        >
                          {creating ? (
                            <><Spinner size="sm" /> .....</>
                          ) : (
                            <><i className="bi bi-cash-coin" /> Tiền mặt</>
                          )}
                        </Button>
                        <Button
                          className="flex-grow-1 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-1"
                          style={{
                            background: "#6366f1",
                            border: "none",
                            padding: "10px 0",
                            fontSize: "0.85rem",
                          }}
                          disabled={creating}
                          onClick={() => submitOrder("QR_PAYOS")}
                        >
                          {creating ? (
                            <><Spinner size="sm" /> .....</>
                          ) : (
                            <><i className="bi bi-qr-code" /> QR PayOS</>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </AdminLayout>
  );
}
