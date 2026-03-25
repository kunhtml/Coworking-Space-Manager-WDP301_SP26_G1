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

export default function StaffPOSPage() {
  const [searchParams] = useSearchParams();
  const urlTableId = searchParams.get("tableId");
  const preselectedRef = useRef(false);

  // ── Tables ──
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableSearch, setTableSearch] = useState("");
  const [tableStatusFilter, setTableStatusFilter] = useState("all");
  const [tableTypeFilter, setTableTypeFilter] = useState("all");
  const [loadingTables, setLoadingTables] = useState(true);

  // ── Menu ──
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
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
    let items = menuItems.filter((item) => normalizeMenuStatus(item) === "AVAILABLE");
    if (selectedCategory !== "all") {
      items = items.filter((item) => {
        const catId = String(item?.categoryId?._id || item?.categoryId || "");
        return catId === selectedCategory;
      });
    }
    if (menuSearch.trim()) {
      const q = menuSearch.trim().toLowerCase();
      items = items.filter((item) =>
        (item.name || "").toLowerCase().includes(q) || (item.description || "").toLowerCase().includes(q),
      );
    }
    return items;
  }, [menuItems, selectedCategory, menuSearch]);

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
  const submitOrder = async () => {
    if (!selectedTable) { setError("Vui lòng chọn bàn trước."); return; }
    if (!cart.length) { setError("Giỏ hàng trống."); return; }

    setCreating(true);
    setError("");
    try {
      const result = await createCounterOrder({
        tableId: selectedTable.id || selectedTable._id,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        durationHours: Number(durationHours || 2),
        items: cart.map((item) => ({ menuItemId: item.menuItemId, quantity: Number(item.quantity || 0), note: "" })),
      });

      const totalAmt = result.totalAmount || 0;
      setSuccess(`✅ Tạo đơn thành công: ${result.orderCode} — ${fmtCur(totalAmt)}`);

      if (result.payment?.checkoutUrl) {
        const openPay = window.confirm(`Tổng tiền: ${fmtCur(totalAmt)}\nMở link thanh toán?`);
        if (openPay) window.open(result.payment.checkoutUrl, "_blank");
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
            <div className="px-3 pt-3 d-flex flex-wrap gap-2">
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

            {/* Table type filter */}
            <div className="px-3 pt-2 d-flex flex-wrap gap-1">
              <span
                className="rounded-pill px-2 py-1 fw-bold"
                style={{
                  background: tableTypeFilter === "all" ? "#6366f1" : "#f1f5f9",
                  color: tableTypeFilter === "all" ? "#fff" : "#475569",
                  fontSize: "0.68rem", cursor: "pointer", transition: "all 0.15s",
                }}
                onClick={() => setTableTypeFilter("all")}
              >
                Tất cả loại
              </span>
              {tableTypes.map((type) => (
                <span
                  key={type}
                  className="rounded-pill px-2 py-1 fw-bold"
                  style={{
                    background: tableTypeFilter === type ? "#6366f1" : "#f1f5f9",
                    color: tableTypeFilter === type ? "#fff" : "#475569",
                    fontSize: "0.68rem", cursor: "pointer", transition: "all 0.15s",
                  }}
                  onClick={() => setTableTypeFilter(type)}
                >
                  {type}
                </span>
              ))}
            </div>

            {/* Search */}
            <div className="px-3 pt-2">
              <div className="staff-search-wrap" style={{ borderRadius: 10 }}>
                <i className="bi bi-search" />
                <input
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Tìm bàn..."
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* Table grid */}
            <Card.Body style={{ maxHeight: "calc(100vh - 380px)", overflowY: "auto" }}>
              {loadingTables ? (
                <div className="text-center py-4">
                  <Spinner animation="border" size="sm" style={{ color: "#6366f1" }} />
                </div>
              ) : displayedTables.length === 0 ? (
                <div className="text-center py-4 text-muted small fw-semibold">Không có bàn phù hợp</div>
              ) : (
                <Row className="g-2">
                  {displayedTables.map((table) => {
                    const cfg = getCfg(table.status);
                    const isSelected = selectedTable && String(selectedTable.id || selectedTable._id) === String(table.id);
                    const icon = getSeatIcon(table.tableType);
                    return (
                      <Col xs={6} sm={4} key={String(table.id)}>
                        <div
                          className="rounded-3 p-2 text-center"
                          style={{
                            cursor: "pointer",
                            background: isSelected ? "#eef2ff" : "#fff",
                            border: `2px solid ${isSelected ? "#6366f1" : cfg.border + "66"}`,
                            boxShadow: isSelected ? "0 0 0 3px rgba(99,102,241,0.15)" : "0 1px 4px rgba(0,0,0,0.04)",
                            transition: "all 0.18s",
                            transform: isSelected ? "scale(1.03)" : "scale(1)",
                          }}
                          onClick={() => setSelectedTable(table)}
                        >
                          <div
                            className="rounded-circle mx-auto mb-1 d-flex align-items-center justify-content-center"
                            style={{
                              width: 36, height: 36,
                              background: isSelected ? "#6366f1" : cfg.bg,
                              color: isSelected ? "#fff" : cfg.color,
                              fontSize: 16, transition: "all 0.18s",
                            }}
                          >
                            <i className={`bi ${icon}`} />
                          </div>
                          <div className="fw-bold text-truncate" style={{ fontSize: "0.78rem", color: "#0f172a" }} title={table.name}>
                            {table.name}
                          </div>
                          <span
                            className="rounded-pill px-2 py-0 fw-bold d-inline-block"
                            style={{ background: cfg.bg, color: cfg.color, fontSize: "0.62rem" }}
                          >
                            {cfg.emoji} {cfg.label}
                          </span>
                          {table.pricePerHour > 0 && (
                            <div style={{ fontSize: "0.62rem", color: "#64748b", fontWeight: 600 }}>
                              {fmtCur(table.pricePerHour)}/h
                            </div>
                          )}
                        </div>
                      </Col>
                    );
                  })}
                </Row>
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
                  {/* Category chips */}
                  <div className="d-flex flex-wrap gap-1">
                    <span
                      className={`rounded-pill px-2 py-1 fw-bold ${selectedCategory === "all" ? "" : ""}`}
                      style={{
                        background: selectedCategory === "all" ? "#6366f1" : "#f1f5f9",
                        color: selectedCategory === "all" ? "#fff" : "#475569",
                        fontSize: "0.72rem", cursor: "pointer", transition: "all 0.15s",
                      }}
                      onClick={() => setSelectedCategory("all")}
                    >
                      Tất cả
                    </span>
                    {categories.map((cat) => (
                      <span
                        key={String(cat._id)}
                        className="rounded-pill px-2 py-1 fw-bold"
                        style={{
                          background: selectedCategory === String(cat._id) ? "#6366f1" : "#f1f5f9",
                          color: selectedCategory === String(cat._id) ? "#fff" : "#475569",
                          fontSize: "0.72rem", cursor: "pointer", transition: "all 0.15s",
                        }}
                        onClick={() => setSelectedCategory(String(cat._id))}
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                  {/* Menu search */}
                  <div className="mt-2">
                    <div className="staff-search-wrap" style={{ borderRadius: 10 }}>
                      <i className="bi bi-search" />
                      <input
                        value={menuSearch}
                        onChange={(e) => setMenuSearch(e.target.value)}
                        placeholder="Tìm món..."
                        style={{ width: "100%" }}
                      />
                    </div>
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

            {/* Cart */}
            <Col xl={4}>
              <Card className="border-0 shadow-sm" style={{ borderRadius: 16, position: "sticky", top: 16 }}>
                <Card.Header className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center" style={{ borderRadius: "16px 16px 0 0" }}>
                  <h5 className="mb-0 fw-bold">
                    <i className="bi bi-cart3 me-2" style={{ color: "#6366f1" }} />Giỏ hàng
                  </h5>
                  <Badge pill style={{ background: "#6366f1", border: "none", fontSize: "0.78rem" }}>
                    {cart.length}
                  </Badge>
                </Card.Header>
                <Card.Body style={{ maxHeight: "calc(100vh - 480px)", overflowY: "auto" }}>
                  {cart.length === 0 ? (
                    <div className="text-center py-4">
                      <div style={{ fontSize: 36 }}>🛒</div>
                      <div className="text-muted fw-semibold small mt-1">Chưa có món</div>
                      <div className="text-muted" style={{ fontSize: "0.72rem" }}>Bấm vào món để thêm</div>
                    </div>
                  ) : (
                    cart.map((item) => (
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
                    ))
                  )}
                </Card.Body>

                {/* Cart footer */}
                <div className="px-3 pb-3">
                  {selectedTable && cart.length > 0 && (
                    <div className="rounded-3 p-2 mb-2" style={{ background: "#f8fafc", fontSize: "0.8rem" }}>
                      <div className="d-flex justify-content-between">
                        <span style={{ color: "#64748b" }}>Thuê bàn ({durationHours}h)</span>
                        <strong>{fmtCur(Number(selectedTable.pricePerHour || 0) * Number(durationHours || 0))}</strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span style={{ color: "#64748b" }}>Dịch vụ</span>
                        <strong>{fmtCur(cartTotal)}</strong>
                      </div>
                      <hr className="my-1" />
                      <div className="d-flex justify-content-between">
                        <strong>Tổng cộng</strong>
                        <strong style={{ color: "#6366f1", fontSize: "1rem" }}>
                          {fmtCur(cartTotal + Number(selectedTable.pricePerHour || 0) * Number(durationHours || 0))}
                        </strong>
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-100 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-2"
                    style={{
                      background: selectedTable && cart.length ? "#6366f1" : "#94a3b8",
                      border: "none",
                      padding: "10px 0",
                      fontSize: "0.92rem",
                    }}
                    disabled={creating || !cart.length || !selectedTable}
                    onClick={submitOrder}
                  >
                    {creating ? (
                      <><Spinner size="sm" /> Đang tạo...</>
                    ) : (
                      <><i className="bi bi-check-circle-fill" /> Tạo đơn</>
                    )}
                  </Button>

                  {!selectedTable && cart.length > 0 && (
                    <div className="text-center mt-1" style={{ color: "#f59e0b", fontSize: "0.72rem", fontWeight: 600 }}>
                      ⚠️ Vui lòng chọn bàn trước
                    </div>
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
