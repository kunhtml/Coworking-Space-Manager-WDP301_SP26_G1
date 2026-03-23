import { useEffect, useState } from "react";
import {
  Alert,
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Modal,
  Form,
  Spinner,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
<<<<<<< HEAD
import { getBookings, updateBookingApi } from "../../services/bookingService";
import {
  createOrderApi,
  getMyOrders,
  updateOrderApi,
} from "../../services/orderService";
import { apiClient } from "../../services/api";
=======
>>>>>>> 765f72acc4f1bd1779ab2e3d1c8dfee0bd49f3d2
import GuestCustomerNavbar from "../../components/common/GuestCustomerNavbar";
import {
  searchAvailableTables,
  createBookingApi,
} from "../../services/bookingService";
import { apiClient } from "../../services/api";

export function meta() {
  return [
    { title: "Đặt chỗ ngồi | Coworking Space" },
    {
      name: "description",
      content:
<<<<<<< HEAD
        "Theo dõi booking, tạo đơn hàng và cập nhật đơn hàng cho khách hàng.",
=======
        "Đặt chỗ ngồi online tại Coworking Space. Chọn thời gian, loại chỗ ngồi phù hợp cho việc học tập và làm việc.",
>>>>>>> 765f72acc4f1bd1779ab2e3d1c8dfee0bd49f3d2
    },
  ];
}

<<<<<<< HEAD
export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
=======
const TYPE_COLORS = [
  { color: "rgba(99, 102, 241, 0.1)", borderColor: "#6366f1" },
  { color: "rgba(34, 197, 94, 0.1)", borderColor: "#22c55e" },
  { color: "rgba(59, 130, 246, 0.1)", borderColor: "#3b82f6" },
  { color: "rgba(251, 191, 36, 0.1)", borderColor: "#fbbf24" },
  { color: "rgba(244, 63, 94, 0.1)", borderColor: "#f43f5e" },
];

function formatTypeTitle(type) {
  if (!type) return "Không xác định";
  return String(type)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function pickIcon(type) {
  const t = String(type || "").toLowerCase();
  if (t.includes("meeting") || t.includes("room")) return "bi-easel";
  if (t.includes("group")) return "bi-people-fill";
  if (t.includes("vip") || t.includes("private")) return "bi-gem";
  return "bi-person-workspace";
}

export default function BookingPage() {
  const { isAuthenticated, user } = useAuth();
>>>>>>> 765f72acc4f1bd1779ab2e3d1c8dfee0bd49f3d2
  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeStart, setSelectedTimeStart] = useState("");
  const [selectedTimeEnd, setSelectedTimeEnd] = useState("");
  const [workspaceTypes, setWorkspaceTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Initialize date to today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
  }, []);

  useEffect(() => {
    const loadWorkspaceTypes = async () => {
      setLoadingTypes(true);
      try {
        const tables = await apiClient.get("/tables");
        const grouped = new Map();

<<<<<<< HEAD
  const canEditBooking = (status) =>
    !["Confirmed", "Cancelled"].includes(status);
  const canEditOrder = (status) => !["Confirmed", "Cancelled"].includes(status);
=======
        for (const t of tables || []) {
          const typeKey = String(t.tableType || "Khác");
          const existing = grouped.get(typeKey) || {
            id: typeKey,
            title: formatTypeTitle(typeKey),
            description: `Loại chỗ: ${formatTypeTitle(typeKey)}`,
            price: Number.POSITIVE_INFINITY,
            capacity: 0,
            features: ["Wi-Fi", "Ổ cắm"],
            icon: pickIcon(typeKey),
            color: TYPE_COLORS[grouped.size % TYPE_COLORS.length].color,
            borderColor: TYPE_COLORS[grouped.size % TYPE_COLORS.length].borderColor,
            popular: false,
            count: 0,
          };

          existing.price = Math.min(existing.price, Number(t.pricePerHour || 0));
          existing.capacity = Math.max(existing.capacity, Number(t.capacity || 0));
          existing.count += 1;
          grouped.set(typeKey, existing);
        }

        const rows = Array.from(grouped.values())
          .sort((a, b) => b.count - a.count)
          .map((t, idx) => ({
            ...t,
            popular: idx === 0,
            capacity: `${t.capacity || 1} chỗ`,
            price: Number.isFinite(t.price) ? t.price : 0,
          }));

        setWorkspaceTypes(rows);
      } catch (err) {
        setError(err.message || "Không thể tải loại chỗ ngồi từ hệ thống.");
      } finally {
        setLoadingTypes(false);
      }
    };

    loadWorkspaceTypes();
  }, []);

  const handleSearch = async () => {
    if (
      !selectedType ||
      !selectedDate ||
      !selectedTimeStart ||
      !selectedTimeEnd
    ) {
      setError("Vui lòng chọn đầy đủ thông tin để tìm chỗ ngồi");
      return;
    }
>>>>>>> 765f72acc4f1bd1779ab2e3d1c8dfee0bd49f3d2

    setLoading(true);
    setError("");

    try {
      const searchParams = {
        date: selectedDate,
        startTime: selectedTimeStart,
        endTime: selectedTimeEnd,
        tableType: selectedType,
      };

      const tables = await searchAvailableTables(searchParams);
      setAvailableTables(tables);

      if (tables.length === 0) {
        setError(
          "Không tìm thấy chỗ ngồi trống trong thời gian này. Vui lòng chọn thời gian khác.",
        );
      }
    } catch (err) {
      setError(err.message || "Lỗi khi tìm kiếm chỗ ngồi");
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

<<<<<<< HEAD
  const bookingMap = useMemo(() => {
    const map = new Map();
    for (const booking of bookings) {
      map.set(String(booking.id), booking);
    }
    return map;
  }, [bookings]);

  const orderCountByBooking = useMemo(() => {
    const map = new Map();
    for (const order of orders) {
      const key = String(order.bookingId || "");
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [orders]);

  const filteredBookings = useMemo(() => {
    const q = bookingSearch.trim().toLowerCase();
    return bookings.filter((booking) => {
      const bookingCode = String(booking.bookingCode || "").toLowerCase();
      const bookingDate = toDateInput(booking.startTime);
      const byCode = !q || bookingCode.includes(q);
      const byDate = !bookingDateFilter || bookingDate === bookingDateFilter;
      const byStatus =
        bookingStatusFilter === "all" || booking.status === bookingStatusFilter;
      return byCode && byDate && byStatus;
    });
  }, [bookings, bookingSearch, bookingDateFilter, bookingStatusFilter]);

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((order) => {
      const orderCode = String(order.id || "")
        .slice(-6)
        .toUpperCase()
        .toLowerCase();
      const orderDate = toDateInput(order.createdAt);
      const byCode = !q || orderCode.includes(q);
      const byDate = !orderDateFilter || orderDate === orderDateFilter;
      const byStatus =
        orderStatusFilter === "all" || order.status === orderStatusFilter;
      return byCode && byDate && byStatus;
    });
  }, [orders, orderSearch, orderDateFilter, orderStatusFilter]);

  const bookingTotalPages = Math.max(
    1,
    Math.ceil(filteredBookings.length / PAGE_SIZE),
  );
  const orderTotalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / PAGE_SIZE),
  );

  const pagedBookings = useMemo(() => {
    const start = (bookingPage - 1) * PAGE_SIZE;
    return filteredBookings.slice(start, start + PAGE_SIZE);
  }, [filteredBookings, bookingPage]);

  const pagedOrders = useMemo(() => {
    const start = (orderPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, orderPage]);

  useEffect(() => {
    setBookingPage(1);
  }, [bookingSearch, bookingDateFilter, bookingStatusFilter]);

  useEffect(() => {
    setOrderPage(1);
  }, [orderSearch, orderDateFilter, orderStatusFilter]);

  useEffect(() => {
    if (!filteredBookings.length) {
      setActiveBookingKey(null);
      return;
    }
    const exists = filteredBookings.some(
      (b) => String(b.id) === String(activeBookingKey),
    );
    if (!exists) {
      setActiveBookingKey(String(filteredBookings[0].id));
    }
  }, [filteredBookings, activeBookingKey]);

  useEffect(() => {
    if (!filteredOrders.length) {
      setActiveOrderKey(null);
      return;
    }
    const exists = filteredOrders.some(
      (o) => String(o.id) === String(activeOrderKey),
    );
    if (!exists) {
      setActiveOrderKey(String(filteredOrders[0].id));
    }
  }, [filteredOrders, activeOrderKey]);
=======
    if (!selectedTable) {
      setError("Vui lòng chọn chỗ ngồi");
      return;
    }

    setBookingLoading(true);
    setError("");
>>>>>>> 765f72acc4f1bd1779ab2e3d1c8dfee0bd49f3d2

    try {
      const bookingData = {
        tableId: selectedTable._id,
        date: selectedDate,
        startTime: selectedTimeStart,
        endTime: selectedTimeEnd,
        pricePerHour: selectedTable.pricePerHour,
        notes: `Đặt ${selectedTable.name} - ${selectedTable.tableType?.name || "N/A"}`,
      };

      const result = await createBookingApi(bookingData);

      setSuccess("Đặt chỗ thành công!");
      setShowConfirmModal(false);

      // Redirect to payment page
      setTimeout(() => {
        navigate(`/payment/${result.bookingId || result._id}`);
      }, 1500);
    } catch (err) {
      setError(err.message || "Lỗi khi đặt chỗ");
    } finally {
      setBookingLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  const getSelectedTypeInfo = () => {
    return workspaceTypes.find((type) => type.id === selectedType);
  };

<<<<<<< HEAD
  const updateOrderLine = (idx, key, value) => {
    setOrderLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l)),
    );
  };

  const addOrderLine = () =>
    setOrderLines((prev) => [...prev, emptyOrderLine()]);

  const removeOrderLine = (idx) => {
    setOrderLines((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx),
    );
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    const payload = {
      bookingId: targetBookingId,
      items: orderLines.map((l) => ({
        menuItemId: l.menuItemId,
        quantity: Number(l.quantity || 0),
        note: l.note || "",
      })),
    };

    setSavingOrder(true);
    try {
      if (orderMode === "create") {
        await createOrderApi(payload);
      } else {
        await updateOrderApi(editingOrderId, { items: payload.items });
      }
      setShowOrderModal(false);
      await loadData();
    } catch (err) {
      setError(err.message || "Lưu đơn hàng thất bại.");
    } finally {
      setSavingOrder(false);
    }
  };

  const total = bookings.length;
  const pendingCount = bookings.filter((b) =>
    ["Pending", "Awaiting_Payment"].includes(b.status),
  ).length;
  const completedCount = bookings.filter(
    (b) => b.status === "Completed",
  ).length;

=======
  const calculateDuration = () => {
    if (!selectedTimeStart || !selectedTimeEnd) return 0;
    const start = new Date(`2000-01-01T${selectedTimeStart}`);
    const end = new Date(`2000-01-01T${selectedTimeEnd}`);
    return (end - start) / (1000 * 60 * 60); // hours
  };

  const calculateTotalPrice = () => {
    const typeInfo = getSelectedTypeInfo();
    const duration = calculateDuration();
    return typeInfo && duration > 0 ? typeInfo.price * duration : 0;
  };

>>>>>>> 765f72acc4f1bd1779ab2e3d1c8dfee0bd49f3d2
  return (
    <div className="min-vh-100 bg-light">
      {/* Header Navigation */}
      <GuestCustomerNavbar activeItem="booking" />

      {/* Hero Section */}
      <section className="py-5 bg-primary text-white">
        <Container>
<<<<<<< HEAD
          <Row className="mb-4 align-items-center">
            <Col>
              <h2 className="fw-bold mb-1 text-dark">
                Quản lý Booking & Đơn hàng
              </h2>
              <p className="text-muted mb-0">
                Xin chào,{" "}
                <span className="fw-medium text-dark">
                  {user?.fullName || user?.email || "Khách"}
                </span>
              </p>
            </Col>
          </Row>

          <Row className="g-4 mb-4">
            <Col md={4}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body className="p-4">
                  <h6 className="text-muted mb-1">Tổng booking</h6>
                  <h3 className="fw-bold mb-0">{loading ? "-" : total}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body className="p-4">
                  <h6 className="text-muted mb-1">Chờ thanh toán</h6>
                  <h3 className="fw-bold mb-0">
                    {loading ? "-" : pendingCount}
                  </h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body className="p-4">
                  <h6 className="text-muted mb-1">Đã hoàn thành</h6>
                  <h3 className="fw-bold mb-0">
                    {loading ? "-" : completedCount}
                  </h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>
=======
          <div className="text-center">
            <div className="mb-3">
              <i className="bi bi-calendar-plus display-6"></i>
            </div>
            <h1 className="display-5 fw-bold mb-3">Đặt chỗ ngồi online</h1>
            <p className="lead mb-0">
              Chọn thời gian và loại chỗ ngồi phù hợp cho việc học tập, làm việc
            </p>
          </div>
        </Container>
      </section>
>>>>>>> 765f72acc4f1bd1779ab2e3d1c8dfee0bd49f3d2

      {/* Booking Form */}
      <section className="py-5">
        <Container>
          {/* Alerts */}
          {error && (
            <Alert
              variant="danger"
              dismissible
              onClose={() => setError("")}
              className="mb-4"
            >
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              variant="success"
              dismissible
              onClose={() => setSuccess("")}
              className="mb-4"
            >
              <i className="bi bi-check-circle me-2"></i>
              {success}
            </Alert>
          )}

<<<<<<< HEAD
          <Card className="shadow-sm border-0 rounded-4 overflow-hidden mb-4">
            <Card.Header className="bg-white border-bottom py-3 px-4">
              <h5 className="fw-bold mb-0 text-dark">Booking</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Row className="g-3 mb-3">
                <Col md={5}>
                  <Form.Control
                    placeholder="Tìm theo mã booking..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                  />
                </Col>
                <Col md={3}>
                  <Form.Control
                    type="date"
                    value={bookingDateFilter}
                    onChange={(e) => setBookingDateFilter(e.target.value)}
                  />
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={bookingStatusFilter}
                    onChange={(e) => setBookingStatusFilter(e.target.value)}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    {Object.entries(BOOKING_STATUS_MAP).map(([value, cfg]) => (
                      <option key={value} value={value}>
                        {cfg.label}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={1}>
                  <Button
                    variant="outline-secondary"
                    className="w-100"
                    onClick={() => {
                      setBookingSearch("");
                      setBookingDateFilter("");
                      setBookingStatusFilter("all");
                    }}
                  >
                    <i className="bi bi-arrow-counterclockwise"></i>
                  </Button>
                </Col>
              </Row>

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted mb-3">
                    Không tìm thấy booking phù hợp bộ lọc.
                  </p>
                  <Button
                    as={Link}
                    to="/order-table"
                    variant="primary"
                    className="rounded-pill px-4"
                  >
                    Đặt chỗ ngay
                  </Button>
                </div>
              ) : (
                <Accordion
                  activeKey={activeBookingKey}
                  onSelect={(k) => setActiveBookingKey(k)}
                >
                  {pagedBookings.map((booking) => {
                    const bKey = String(booking.id);
                    return (
                      <Accordion.Item
                        eventKey={bKey}
                        key={bKey}
                        className="mb-3 border rounded-3 overflow-hidden"
                      >
                        <Accordion.Header>
                          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center w-100 me-3 gap-2">
                            <div>
                              <div className="fw-bold text-dark">
                                {booking.bookingCode} - {booking.spaceName}
                              </div>
                              <small className="text-muted">
                                {formatDateTime(booking.startTime)}
                              </small>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <StatusPill
                                status={booking.status}
                                map={BOOKING_STATUS_MAP}
                              />
                              <Badge bg="dark" pill>
                                Orders: {orderCountByBooking.get(bKey) || 0}
                              </Badge>
                            </div>
                          </div>
                        </Accordion.Header>
                        <Accordion.Body className="bg-light">
                          <Row className="g-3 mb-3">
                            <Col md={6}>
                              <div className="small text-muted">Không gian</div>
                              <div className="fw-semibold">
                                {booking.spaceName}
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="small text-muted">Mã booking</div>
                              <div className="fw-semibold">
                                {booking.bookingCode}
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="small text-muted">Bắt đầu</div>
                              <div className="fw-semibold">
                                {formatDateTime(booking.startTime)}
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="small text-muted">Kết thúc</div>
                              <div className="fw-semibold">
                                {formatDateTime(booking.endTime)}
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="small text-muted">
                                Giá trị booking
                              </div>
                              <div className="fw-semibold">
                                {fmt(booking.depositAmount)}d
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="small text-muted">Trạng thái</div>
                              <div>
                                <StatusPill
                                  status={booking.status}
                                  map={BOOKING_STATUS_MAP}
                                />
                              </div>
                            </Col>
                          </Row>

                          <div className="d-flex flex-wrap gap-2">
                            {canEditBooking(booking.status) && (
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => openBookingEditor(booking)}
                              >
                                <i className="bi bi-pencil-square me-1"></i>Edit
                                booking
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              onClick={() => {
                                setInvoiceBooking(booking);
                                setShowBookingInvoiceModal(true);
                              }}
                            >
                              <i className="bi bi-receipt me-1"></i>Hóa đơn
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => openCreateOrder(booking.id)}
                              disabled={booking.status === "Cancelled"}
                            >
                              <i className="bi bi-receipt me-1"></i>Tạo order
                            </Button>
                            {["Pending", "Awaiting_Payment"].includes(
                              booking.status,
                            ) && (
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() =>
                                  navigate(`/payment/${booking.id}`)
                                }
                              >
                                <i className="bi bi-credit-card me-1"></i>Thanh
                                toán booking
                              </Button>
                            )}
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>
                    );
                  })}
                </Accordion>
              )}

              {!loading && filteredBookings.length > 0 && (
                <ListPagination
                  page={bookingPage}
                  totalPages={bookingTotalPages}
                  onChange={setBookingPage}
                />
              )}
            </Card.Body>
          </Card>

          <Card className="shadow-sm border-0 rounded-4 overflow-hidden">
            <Card.Header className="bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 text-dark">Order History</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Row className="g-3 mb-3">
                <Col md={5}>
                  <Form.Control
                    placeholder="Tìm theo mã order..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                  />
                </Col>
                <Col md={3}>
                  <Form.Control
                    type="date"
                    value={orderDateFilter}
                    onChange={(e) => setOrderDateFilter(e.target.value)}
                  />
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    {Object.entries(ORDER_STATUS_MAP).map(([value, cfg]) => (
                      <option key={value} value={value}>
                        {cfg.label}
                      </option>
=======
          <Row className="g-4">
            {/* Booking Form */}
            <Col lg={8}>
              <Card className="border-0 shadow-sm rounded-4 mb-4">
                <Card.Header className="bg-transparent border-0 p-4">
                  <h4 className="fw-bold mb-0">
                    <i className="bi bi-1-circle-fill text-primary me-2"></i>
                    Chọn loại chỗ ngồi
                  </h4>
                </Card.Header>
                <Card.Body className="p-4 pt-0">
                  {loadingTypes ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" variant="primary" />
                    </div>
                  ) : (
                  <Row className="g-3">
                    {workspaceTypes.map((type) => (
                      <Col key={type.id} lg={6}>
                        <div
                          className={`workspace-type-card p-3 rounded-3 border-2 h-100 ${selectedType === type.id ? "border-primary" : "border-light"}`}
                          style={{
                            backgroundColor:
                              selectedType === type.id ? type.color : "white",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onClick={() => setSelectedType(type.id)}
                        >
                          <div className="d-flex align-items-start gap-3">
                            <div
                              className="workspace-icon"
                              style={{ fontSize: "2.5rem" }}
                            >
                                  <i className={type.icon}></i>
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center gap-2 mb-2">
                                <h6 className="fw-bold mb-0">{type.title}</h6>
                                {type.popular && (
                                  <Badge bg="warning" className="px-2">
                                    Phổ biến
                                  </Badge>
                                )}
                              </div>
                              <p className="text-muted small mb-2">
                                {type.description}
                              </p>
                              <div className="d-flex align-items-center gap-2 small text-muted mb-2">
                                <span>
                                  <i className="bi bi-people me-1"></i>
                                  {type.capacity}
                                </span>
                                {type.features
                                  .slice(0, 2)
                                  .map((feature, idx) => (
                                    <span key={idx}>
                                      <i className="bi bi-check-circle me-1 text-success"></i>
                                      {feature}
                                    </span>
                                  ))}
                              </div>
                              <div className="fw-bold text-primary">
                                {formatPrice(type.price)}/giờ
                              </div>
                            </div>
                          </div>
                        </div>
                      </Col>
>>>>>>> 765f72acc4f1bd1779ab2e3d1c8dfee0bd49f3d2
                    ))}
                  </Row>
                  )}
                </Card.Body>
              </Card>

<<<<<<< HEAD
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <Alert variant="secondary" className="mb-0">
                  Không tìm thấy order phù hợp bộ lọc.
                </Alert>
              ) : (
                <Accordion
                  activeKey={activeOrderKey}
                  onSelect={(k) => setActiveOrderKey(k)}
                >
                  {pagedOrders.map((order) => {
                    const oKey = String(order.id);
                    const relatedBooking = bookingMap.get(
                      String(order.bookingId),
                    );
                    return (
                      <Accordion.Item
                        eventKey={oKey}
                        key={oKey}
                        className="mb-3 border rounded-3 overflow-hidden"
                      >
                        <Accordion.Header>
                          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center w-100 me-3 gap-2">
                            <div>
                              <div className="fw-bold text-dark">
                                Order #
                                {String(order.id).slice(-6).toUpperCase()}
                              </div>
                              <small className="text-muted">
                                Booking:{" "}
                                {relatedBooking?.bookingCode ||
                                  String(order.bookingId || "--")
                                    .slice(-6)
                                    .toUpperCase()}
                              </small>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <StatusPill
                                status={order.status}
                                map={ORDER_STATUS_MAP}
                              />
                              <Badge bg="info" text="dark" pill>
                                {fmt(order.totalAmount)}d
                              </Badge>
                            </div>
                          </div>
                        </Accordion.Header>
                        <Accordion.Body className="bg-light">
                          <Row className="g-3 mb-3">
                            <Col md={6}>
                              <div className="small text-muted">Mã order</div>
                              <div className="fw-semibold">
                                #{String(order.id).slice(-6).toUpperCase()}
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="small text-muted">
                                Thời gian tạo
                              </div>
                              <div className="fw-semibold">
                                {formatDateTime(order.createdAt)}
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="small text-muted">
                                Booking liên quan
                              </div>
                              <div className="fw-semibold">
                                {relatedBooking?.bookingCode || "--"}
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="small text-muted">Không gian</div>
                              <div className="fw-semibold">
                                {relatedBooking?.spaceName || "--"}
                              </div>
                            </Col>
                          </Row>

                          <div className="table-responsive mb-3">
                            <table className="table table-sm align-middle mb-0">
                              <thead>
                                <tr>
                                  <th>Món</th>
                                  <th>SL</th>
                                  <th>Đơn giá</th>
                                  <th>Ghi chú</th>
                                  <th className="text-end">Thành tiền</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(order.items || []).map((item) => (
                                  <tr key={item.id}>
                                    <td>{item.menuName}</td>
                                    <td>{item.quantity}</td>
                                    <td>{fmt(item.priceAtOrder)}d</td>
                                    <td>{item.note || "-"}</td>
                                    <td className="text-end fw-semibold">
                                      {fmt(item.lineTotal)}d
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {canEditOrder(order.status) && (
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => openEditOrder(order)}
                            >
                              <i className="bi bi-pencil-square me-1"></i>Edit
                              order
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => {
                              setInvoiceOrder({ order, relatedBooking });
                              setShowInvoiceModal(true);
=======
              <Card className="border-0 shadow-sm rounded-4 mb-4">
                <Card.Header className="bg-transparent border-0 p-4">
                  <h4 className="fw-bold mb-0">
                    <i className="bi bi-2-circle-fill text-primary me-2"></i>
                    Chọn thời gian
                  </h4>
                </Card.Header>
                <Card.Body className="p-4 pt-0">
                  <Row className="g-3">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">
                          Ngày đặt
                        </Form.Label>
                        <Form.Control
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">
                          Giờ bắt đầu
                        </Form.Label>
                        <Form.Control
                          type="time"
                          value={selectedTimeStart}
                          onChange={(e) => setSelectedTimeStart(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">
                          Giờ kết thúc
                        </Form.Label>
                        <Form.Control
                          type="time"
                          value={selectedTimeEnd}
                          onChange={(e) => setSelectedTimeEnd(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="mt-4">
                    <Button
                      variant="primary"
                      size="lg"
                      className="px-5"
                      onClick={handleSearch}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Đang tìm...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-search me-2"></i>
                          Tìm chỗ trống
                        </>
                      )}
                    </Button>
                  </div>
                </Card.Body>
              </Card>

              {/* Available Tables */}
              {availableTables.length > 0 && (
                <Card className="border-0 shadow-sm rounded-4">
                  <Card.Header className="bg-transparent border-0 p-4">
                    <h4 className="fw-bold mb-0">
                      <i className="bi bi-3-circle-fill text-primary me-2"></i>
                      Chọn chỗ ngồi ({availableTables.length} chỗ trống)
                    </h4>
                  </Card.Header>
                  <Card.Body className="p-4 pt-0">
                    <Row className="g-3">
                      {availableTables.map((table) => (
                        <Col key={table._id} md={6} lg={4}>
                          <div
                            className={`table-card p-3 rounded-3 border-2 ${selectedTable?._id === table._id ? "border-primary bg-primary bg-opacity-10" : "border-light bg-white"}`}
                            style={{
                              cursor: "pointer",
                              transition: "all 0.2s ease",
>>>>>>> 765f72acc4f1bd1779ab2e3d1c8dfee0bd49f3d2
                            }}
                            onClick={() => setSelectedTable(table)}
                          >
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <h6 className="fw-bold mb-0">{table.name}</h6>
                              <Badge bg="success" className="small">
                                Trống
                              </Badge>
                            </div>
                            <p className="text-muted small mb-2">
                              {table.tableType?.name} • {table.capacity} chỗ
                            </p>
                            <p className="text-muted small mb-0">
                              <i className="bi bi-geo-alt me-1"></i>
                              {table.location || "Tầng trệt"}
                            </p>
                          </div>
                        </Col>
                      ))}
                    </Row>

                    {selectedTable && (
                      <div className="mt-4 text-center">
                        <Button
                          variant="success"
                          size="lg"
                          className="px-5"
                          onClick={() => setShowConfirmModal(true)}
                        >
                          <i className="bi bi-calendar-check me-2"></i>
                          Đặt chỗ ngay
                        </Button>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              )}
            </Col>

            {/* Booking Summary */}
            <Col lg={4}>
              <div className="sticky-top" style={{ top: "100px" }}>
                <Card className="border-0 shadow-sm rounded-4">
                  <Card.Header className="bg-primary text-white border-0 p-4">
                    <h5 className="fw-bold mb-0">
                      <i className="bi bi-receipt me-2"></i>
                      Tóm tắt đặt chỗ
                    </h5>
                  </Card.Header>
                  <Card.Body className="p-4">
                    {selectedType ? (
                      <>
                        <div className="mb-3">
                          <h6 className="fw-semibold mb-1">Loại chỗ ngồi</h6>
                          <p className="text-muted mb-0">
                            {getSelectedTypeInfo()?.title}
                          </p>
                        </div>

<<<<<<< HEAD
      <Modal
        show={showBookingModal}
        onHide={() => setShowBookingModal(false)}
        centered
      >
        <Form onSubmit={submitBookingUpdate}>
          <Modal.Header closeButton>
            <Modal.Title>Chỉnh sửa booking</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label>Họ tên</Form.Label>
                <Form.Control
                  value={bookingForm.guestName}
                  onChange={(e) =>
                    setBookingForm((p) => ({ ...p, guestName: e.target.value }))
                  }
                  required
                />
              </Col>
              <Col md={6}>
                <Form.Label>Số điện thoại</Form.Label>
                <Form.Control
                  value={bookingForm.guestPhone}
                  onChange={(e) =>
                    setBookingForm((p) => ({
                      ...p,
                      guestPhone: e.target.value,
                    }))
                  }
                  required
                />
              </Col>
              <Col md={6}>
                <Form.Label>Ngày</Form.Label>
                <Form.Control
                  type="date"
                  value={bookingForm.arrivalDate}
                  onChange={(e) =>
                    setBookingForm((p) => ({
                      ...p,
                      arrivalDate: e.target.value,
                    }))
                  }
                  required
                />
              </Col>
              <Col md={6}>
                <Form.Label>Giờ</Form.Label>
                <Form.Control
                  type="time"
                  value={bookingForm.arrivalTime}
                  onChange={(e) =>
                    setBookingForm((p) => ({
                      ...p,
                      arrivalTime: e.target.value,
                    }))
                  }
                  required
                />
              </Col>
              <Col md={6}>
                <Form.Label>Thời lượng (giờ)</Form.Label>
                <Form.Control
                  type="number"
                  min={1}
                  step={1}
                  value={bookingForm.duration}
                  onChange={(e) =>
                    setBookingForm((p) => ({ ...p, duration: e.target.value }))
                  }
                  required
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowBookingModal(false)}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" disabled={savingBooking}>
              {savingBooking ? "Đang lưu..." : "Lưu booking"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={showOrderModal}
        onHide={() => setShowOrderModal(false)}
        size="lg"
        centered
      >
        <Form onSubmit={submitOrder}>
          <Modal.Header closeButton>
            <Modal.Title>
              {orderMode === "create" ? "Tạo đơn hàng" : "Cập nhật đơn hàng"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <small className="text-muted">
                Booking:{" "}
                {targetBookingId
                  ? String(targetBookingId).slice(-6).toUpperCase()
                  : "--"}
              </small>
              <Button
                size="sm"
                variant="outline-primary"
                onClick={addOrderLine}
                type="button"
              >
                <i className="bi bi-plus-lg me-1"></i>Thêm món
              </Button>
            </div>

            <Row className="g-2 fw-semibold text-muted small mb-2 px-1">
              <Col md={5}>Món</Col>
              <Col md={2}>Số lượng</Col>
              <Col md={4}>Ghi chú</Col>
              <Col md={1}></Col>
            </Row>

            {orderLines.map((line, idx) => (
              <Row className="g-2 mb-2" key={`${idx}-${line.menuItemId}`}>
                <Col md={5}>
                  <Form.Select
                    value={line.menuItemId}
                    onChange={(e) =>
                      updateOrderLine(idx, "menuItemId", e.target.value)
                    }
                    required
                  >
                    <option value="">Chọn món...</option>
                    {menuItems.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} - {fmt(m.price)}d
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Control
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) =>
                      updateOrderLine(idx, "quantity", e.target.value)
                    }
                    required
                  />
                </Col>
                <Col md={4}>
                  <Form.Control
                    value={line.note}
                    onChange={(e) =>
                      updateOrderLine(idx, "note", e.target.value)
                    }
                    placeholder="Ghi chú"
                  />
                </Col>
                <Col md={1} className="d-grid">
                  <Button
                    type="button"
                    variant="outline-danger"
                    onClick={() => removeOrderLine(idx)}
                  >
                    <i className="bi bi-x-lg"></i>
                  </Button>
                </Col>
              </Row>
            ))}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowOrderModal(false)}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" disabled={savingOrder}>
              {savingOrder ? "Đang lưu..." : "Lưu đơn hàng"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={showBookingInvoiceModal}
        onHide={() => {
          setShowBookingInvoiceModal(false);
          setInvoiceBooking(null);
        }}
        centered
        size="lg"
      >
        <Modal.Body className="p-4">
          <div className="border rounded-4 p-4">
            <h3 className="fw-bold mb-0">Coworking Space</h3>
            <div className="text-secondary fw-semibold">HÓA ĐƠN BOOKING</div>
            <hr />
            <div className="fw-bold mb-2">THÔNG TIN BOOKING</div>
            <div className="d-flex justify-content-between">
              <span>Mã booking</span>
              <strong>{invoiceBooking?.bookingCode || "--"}</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Không gian</span>
              <strong>{invoiceBooking?.spaceName || "--"}</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Bắt đầu</span>
              <strong>{formatDateTime(invoiceBooking?.startTime)}</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Kết thúc</span>
              <strong>{formatDateTime(invoiceBooking?.endTime)}</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Trạng thái</span>
              <strong>
                {BOOKING_STATUS_MAP[invoiceBooking?.status]?.label ||
                  invoiceBooking?.status ||
                  "--"}
              </strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Số order liên quan</span>
              <strong>
                {orderCountByBooking.get(String(invoiceBooking?.id || "")) || 0}
              </strong>
            </div>

            <hr />
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0 text-secondary">TỔNG BOOKING</h5>
              <h3 className="text-primary fw-bold mb-0">
                {fmt(invoiceBooking?.depositAmount)}d
              </h3>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 d-flex gap-2">
          <Button
            variant="outline-secondary"
            className="w-100"
            onClick={() => {
              setShowBookingInvoiceModal(false);
              setInvoiceBooking(null);
            }}
          >
            Đóng
          </Button>
          <Button
            className="w-100"
            variant="primary"
            onClick={() => window.print()}
          >
            <i className="bi bi-printer me-2"></i>In hóa đơn booking
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showInvoiceModal}
        onHide={() => {
          setShowInvoiceModal(false);
          setInvoiceOrder(null);
        }}
        centered
        size="lg"
      >
        <Modal.Body className="p-4">
          <div className="border rounded-4 p-4">
            <h3 className="fw-bold mb-0">Coworking Space</h3>
            <div className="text-secondary fw-semibold">HÓA ĐƠN ĐIỆN TỬ</div>
            <hr />
            <div className="fw-bold mb-2">THÔNG TIN ĐƠN HÀNG</div>
            <div className="d-flex justify-content-between">
              <span>Mã đơn</span>
              <strong>
                #
                {String(invoiceOrder?.order?.id || "")
                  .slice(-6)
                  .toUpperCase()}
              </strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Ngày tạo</span>
              <strong>{formatDateTime(invoiceOrder?.order?.createdAt)}</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Mã booking</span>
              <strong>
                {invoiceOrder?.relatedBooking?.bookingCode || "--"}
              </strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Không gian</span>
              <strong>{invoiceOrder?.relatedBooking?.spaceName || "--"}</strong>
            </div>

            <div className="fw-bold mt-3 mb-2">CHI TIẾT MÓN</div>
            {(invoiceOrder?.order?.items || []).map((item) => (
              <div
                key={item.id}
                className="d-flex justify-content-between border-bottom py-2"
              >
                <span>
                  {item.menuName} x{item.quantity}
                </span>
                <strong>{fmt(item.lineTotal)}d</strong>
=======
                        {selectedDate && (
                          <div className="mb-3">
                            <h6 className="fw-semibold mb-1">Ngày</h6>
                            <p className="text-muted mb-0">
                              {new Date(selectedDate).toLocaleDateString(
                                "vi-VN",
                              )}
                            </p>
                          </div>
                        )}

                        {selectedTimeStart && selectedTimeEnd && (
                          <div className="mb-3">
                            <h6 className="fw-semibold mb-1">Thời gian</h6>
                            <p className="text-muted mb-0">
                              {selectedTimeStart} - {selectedTimeEnd}
                              <br />
                              <small>({calculateDuration()} giờ)</small>
                            </p>
                          </div>
                        )}

                        {selectedTable && (
                          <div className="mb-3">
                            <h6 className="fw-semibold mb-1">Chỗ ngồi</h6>
                            <p className="text-muted mb-0">
                              {selectedTable.name}
                            </p>
                          </div>
                        )}

                        {calculateDuration() > 0 && (
                          <>
                            <hr />
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fw-semibold">Tổng tiền:</span>
                              <span className="fw-bold text-primary h5 mb-0">
                                {formatPrice(calculateTotalPrice())}
                              </span>
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <i
                          className="bi bi-calendar-x text-muted"
                          style={{ fontSize: "3rem" }}
                        ></i>
                        <p className="text-muted mt-2 mb-0">
                          Chọn loại chỗ ngồi để xem tóm tắt
                        </p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
>>>>>>> 765f72acc4f1bd1779ab2e3d1c8dfee0bd49f3d2
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Booking Confirmation Modal */}
      <Modal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">
            <i className="bi bi-check-circle text-success me-2"></i>
            Xác nhận đặt chỗ
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedTable && (
            <div>
              <h6 className="fw-semibold mb-3">Thông tin đặt chỗ:</h6>
              <div className="bg-light rounded-3 p-3 mb-3">
                <div className="row g-2">
                  <div className="col-6">
                    <strong>Chỗ ngồi:</strong> {selectedTable.name}
                  </div>
                  <div className="col-6">
                    <strong>Loại:</strong> {getSelectedTypeInfo()?.title}
                  </div>
                  <div className="col-6">
                    <strong>Ngày:</strong>{" "}
                    {new Date(selectedDate).toLocaleDateString("vi-VN")}
                  </div>
                  <div className="col-6">
                    <strong>Thời gian:</strong> {selectedTimeStart} -{" "}
                    {selectedTimeEnd}
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center p-3 bg-primary bg-opacity-10 rounded-3">
                <span className="fw-semibold">Tổng tiền:</span>
                <span className="fw-bold text-primary h5 mb-0">
                  {formatPrice(calculateTotalPrice())}
                </span>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmModal(false)}
          >
            Hủy
          </Button>
          <Button
<<<<<<< HEAD
            className="w-100"
            variant="primary"
            onClick={() => window.print()}
          >
            <i className="bi bi-printer me-2"></i>In hóa đơn
=======
            variant="primary"
            onClick={handleBooking}
            disabled={bookingLoading}
          >
            {bookingLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Đang đặt...
              </>
            ) : (
              <>
                <i className="bi bi-credit-card me-2"></i>
                Thanh toán
              </>
            )}
>>>>>>> 765f72acc4f1bd1779ab2e3d1c8dfee0bd49f3d2
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
