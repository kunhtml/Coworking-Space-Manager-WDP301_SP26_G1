import { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Navbar,
  Pagination,
  Row,
  Spinner,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import {
  getBookings,
  updateBookingApi,
} from "../../services/bookingService";
import {
  createOrderApi,
  getMyOrders,
  updateOrderApi,
} from "../../services/orderService";
import { apiClient } from "../../services/api";
import AuthNavActions from "../../components/common/AuthNavActions";

export function meta() {
  return [
    { title: "Đơn hàng & Đặt chỗ | Nexus Coffee" },
    {
      name: "description",
      content: "Theo dõi booking, tạo đơn hàng và cập nhật đơn hàng cho khách hàng.",
    },
  ];
}

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Number(n || 0));
const PAGE_SIZE = 5;

const BOOKING_STATUS_MAP = {
  Pending: { label: "Chờ thanh toán", bg: "warning", textClass: "text-dark" },
  Awaiting_Payment: { label: "Chờ thanh toán", bg: "warning", textClass: "text-dark" },
  Confirmed: { label: "Đã xác nhận", bg: "success", textClass: "text-white" },
  Completed: { label: "Đã hoàn thành", bg: "secondary", textClass: "text-white" },
  Cancelled: { label: "Đã hủy", bg: "danger", textClass: "text-white" },
};

const ORDER_STATUS_MAP = {
  Pending: { label: "Chờ xác nhận", bg: "warning", textClass: "text-dark" },
  Confirmed: { label: "Đã xác nhận", bg: "success", textClass: "text-white" },
  Cancelled: { label: "Đã hủy", bg: "danger", textClass: "text-white" },
};

function statusBadge(status, map) {
  const s = map[status] || {
    label: status || "Unknown",
    bg: "secondary",
    textClass: "text-white",
  };
  return (
    <Badge bg={s.bg} className={`px-3 py-2 rounded-pill fw-medium ${s.textClass}`}>
      {s.label}
    </Badge>
  );
}

function formatDateTime(iso) {
  if (!iso) return "--";
  const d = new Date(iso);
  return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function durationFromRange(start, end) {
  if (!start || !end) return 1;
  const diff = (new Date(end) - new Date(start)) / (1000 * 60 * 60);
  return diff > 0 ? Number(diff.toFixed(1)) : 1;
}

function toDateInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function toTimeInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function emptyOrderLine() {
  return { menuItemId: "", quantity: 1, note: "" };
}

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeBookingKey, setActiveBookingKey] = useState(null);
  const [activeOrderKey, setActiveOrderKey] = useState(null);
  const [bookingPage, setBookingPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [savingBooking, setSavingBooking] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    guestName: "",
    guestPhone: "",
    arrivalDate: "",
    arrivalTime: "",
    duration: 1,
  });

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderMode, setOrderMode] = useState("create");
  const [targetBookingId, setTargetBookingId] = useState("");
  const [editingOrderId, setEditingOrderId] = useState("");
  const [orderLines, setOrderLines] = useState([emptyOrderLine()]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [showBookingInvoiceModal, setShowBookingInvoiceModal] = useState(false);
  const [invoiceBooking, setInvoiceBooking] = useState(null);

  const canEditBooking = (status) => !["Confirmed", "Cancelled"].includes(status);
  const canEditOrder = (status) => !["Confirmed", "Cancelled"].includes(status);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [bookingRows, orderRows, menuRows] = await Promise.all([
        getBookings(),
        getMyOrders(),
        apiClient.get("/menu/items"),
      ]);
      setBookings(bookingRows || []);
      setOrders(orderRows || []);
      setMenuItems(Array.isArray(menuRows) ? menuRows : []);
      if (bookingRows?.length && !activeBookingKey) {
        setActiveBookingKey(String(bookingRows[0].id));
      }
      if (orderRows?.length && !activeOrderKey) {
        setActiveOrderKey(String(orderRows[0].id));
      }
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    loadData();
  }, [isAuthenticated, navigate]);

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

  const bookingTotalPages = Math.max(1, Math.ceil(bookings.length / PAGE_SIZE));
  const orderTotalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));

  const pagedBookings = useMemo(() => {
    const start = (bookingPage - 1) * PAGE_SIZE;
    return bookings.slice(start, start + PAGE_SIZE);
  }, [bookings, bookingPage]);

  const pagedOrders = useMemo(() => {
    const start = (orderPage - 1) * PAGE_SIZE;
    return orders.slice(start, start + PAGE_SIZE);
  }, [orders, orderPage]);

  useEffect(() => {
    if (bookingPage > bookingTotalPages) {
      setBookingPage(bookingTotalPages);
    }
  }, [bookingPage, bookingTotalPages]);

  useEffect(() => {
    if (orderPage > orderTotalPages) {
      setOrderPage(orderTotalPages);
    }
  }, [orderPage, orderTotalPages]);

  const openBookingEditor = (booking) => {
    setEditingBooking(booking);
    setBookingForm({
      guestName: user?.fullName || "",
      guestPhone: user?.phone || "",
      arrivalDate: toDateInput(booking.startTime),
      arrivalTime: toTimeInput(booking.startTime),
      duration: durationFromRange(booking.startTime, booking.endTime),
    });
    setShowBookingModal(true);
  };

  const submitBookingUpdate = async (e) => {
    e.preventDefault();
    if (!editingBooking) return;
    setSavingBooking(true);
    try {
      await updateBookingApi(editingBooking.id, {
        guestName: bookingForm.guestName,
        guestPhone: bookingForm.guestPhone,
        arrivalDate: bookingForm.arrivalDate,
        arrivalTime: bookingForm.arrivalTime,
        duration: Number(bookingForm.duration),
      });
      setShowBookingModal(false);
      await loadData();
    } catch (err) {
      setError(err.message || "Cập nhật booking thất bại.");
    } finally {
      setSavingBooking(false);
    }
  };

  const openCreateOrder = (bookingId) => {
    setOrderMode("create");
    setTargetBookingId(String(bookingId));
    setEditingOrderId("");
    setOrderLines([emptyOrderLine()]);
    setShowOrderModal(true);
  };

  const openEditOrder = (order) => {
    setOrderMode("edit");
    setTargetBookingId(String(order.bookingId));
    setEditingOrderId(String(order.id));
    setOrderLines(
      order.items?.length
        ? order.items.map((i) => ({
            menuItemId: String(i.menuItemId || ""),
            quantity: Number(i.quantity || 1),
            note: i.note || "",
          }))
        : [emptyOrderLine()],
    );
    setShowOrderModal(true);
  };

  const updateOrderLine = (idx, key, value) => {
    setOrderLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l)));
  };

  const addOrderLine = () => setOrderLines((prev) => [...prev, emptyOrderLine()]);

  const removeOrderLine = (idx) => {
    setOrderLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
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
  const pendingCount = bookings.filter((b) => ["Pending", "Awaiting_Payment"].includes(b.status)).length;
  const completedCount = bookings.filter((b) => b.status === "Completed").length;

  return (
    <div className="d-flex flex-column min-vh-100 font-monospace">
      <Navbar expand="lg" className="bg-dark border-bottom border-secondary sticky-top py-3" variant="dark">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold text-white fs-4 d-flex align-items-center">
            <i className="bi bi-cup-hot-fill me-2 fs-3"></i>
            NEXUS COFFEE
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0 shadow-none" />
          <Navbar.Collapse id="basic-navbar-nav">
            <div className="ms-auto d-flex flex-column flex-lg-row gap-4 align-items-lg-center mt-3 mt-lg-0">
              <Link to="/spaces" className="text-decoration-none text-light fw-medium px-2 py-1 hover-primary transition-all text-uppercase">
                Không gian
              </Link>
              <Link to="/order-table" className="text-decoration-none text-light fw-medium px-2 py-1 hover-primary transition-all text-uppercase">
                Đặt bàn
              </Link>
              <Link to="/menu" className="text-decoration-none text-light fw-medium px-2 py-1 hover-primary transition-all text-uppercase">
                Thực đơn
              </Link>
              <AuthNavActions />
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="flex-grow-1 bg-light py-5">
        <Container>
          <Row className="mb-4 align-items-center">
            <Col>
              <h2 className="fw-bold mb-1 text-dark">Quản lý Booking & Đơn hàng</h2>
              <p className="text-muted mb-0">
                Xin chào, <span className="fw-medium text-dark">{user?.fullName || user?.email || "Khách"}</span>
              </p>
            </Col>
          </Row>

          <Row className="g-4 mb-4">
            <Col md={4}>
              <Card className="border-0 shadow-sm rounded-4 h-100"><Card.Body className="p-4"><h6 className="text-muted mb-1">Tổng booking</h6><h3 className="fw-bold mb-0">{loading ? "-" : total}</h3></Card.Body></Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm rounded-4 h-100"><Card.Body className="p-4"><h6 className="text-muted mb-1">Chờ thanh toán</h6><h3 className="fw-bold mb-0">{loading ? "-" : pendingCount}</h3></Card.Body></Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm rounded-4 h-100"><Card.Body className="p-4"><h6 className="text-muted mb-1">Đã hoàn thành</h6><h3 className="fw-bold mb-0">{loading ? "-" : completedCount}</h3></Card.Body></Card>
            </Col>
          </Row>

          {error && (
            <Alert variant="danger" className="mb-4">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          <Card className="shadow-sm border-0 rounded-4 overflow-hidden mb-4">
            <Card.Header className="bg-white border-bottom py-3 px-4">
              <h5 className="fw-bold mb-0 text-dark">Booking</h5>
            </Card.Header>
            <Card.Body className="p-4">
              {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted mb-3">Bạn chưa có booking nào.</p>
                  <Button as={Link} to="/order-table" variant="primary" className="rounded-pill px-4">Đặt chỗ ngay</Button>
                </div>
              ) : (
                <Accordion activeKey={activeBookingKey} onSelect={(k) => setActiveBookingKey(k)}>
                  {pagedBookings.map((booking) => {
                    const bKey = String(booking.id);
                    return (
                      <Accordion.Item eventKey={bKey} key={bKey} className="mb-3 border rounded-3 overflow-hidden">
                        <Accordion.Header>
                          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center w-100 me-3 gap-2">
                            <div>
                              <div className="fw-bold text-dark">{booking.bookingCode} - {booking.spaceName}</div>
                              <small className="text-muted">{formatDateTime(booking.startTime)}</small>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              {statusBadge(booking.status, BOOKING_STATUS_MAP)}
                              <Badge bg="dark" pill>Orders: {orderCountByBooking.get(bKey) || 0}</Badge>
                            </div>
                          </div>
                        </Accordion.Header>
                        <Accordion.Body className="bg-light">
                          <Row className="g-3 mb-3">
                            <Col md={6}><div className="small text-muted">Không gian</div><div className="fw-semibold">{booking.spaceName}</div></Col>
                            <Col md={6}><div className="small text-muted">Mã booking</div><div className="fw-semibold">{booking.bookingCode}</div></Col>
                            <Col md={6}><div className="small text-muted">Bắt đầu</div><div className="fw-semibold">{formatDateTime(booking.startTime)}</div></Col>
                            <Col md={6}><div className="small text-muted">Kết thúc</div><div className="fw-semibold">{formatDateTime(booking.endTime)}</div></Col>
                            <Col md={6}><div className="small text-muted">Giá trị booking</div><div className="fw-semibold">{fmt(booking.depositAmount)}đ</div></Col>
                            <Col md={6}><div className="small text-muted">Trạng thái</div><div>{statusBadge(booking.status, BOOKING_STATUS_MAP)}</div></Col>
                          </Row>

                          <div className="d-flex flex-wrap gap-2">
                            {canEditBooking(booking.status) && (
                              <Button size="sm" variant="outline-primary" onClick={() => openBookingEditor(booking)}>
                                <i className="bi bi-pencil-square me-1"></i>Edit booking
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
                            <Button size="sm" variant="primary" onClick={() => openCreateOrder(booking.id)} disabled={booking.status === "Cancelled"}>
                              <i className="bi bi-receipt me-1"></i>Tạo order
                            </Button>
                            {["Pending", "Awaiting_Payment"].includes(booking.status) && (
                              <Button size="sm" variant="success" onClick={() => navigate(`/payment/${booking.id}`)}>
                                <i className="bi bi-credit-card me-1"></i>Thanh toán booking
                              </Button>
                            )}
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>
                    );
                  })}
                </Accordion>
              )}

              {!loading && bookings.length > 0 && (
                <div className="d-flex justify-content-center mt-3">
                  <Pagination className="mb-0">
                    <Pagination.Prev
                      disabled={bookingPage === 1}
                      onClick={() => setBookingPage((p) => Math.max(1, p - 1))}
                    />
                    {Array.from({ length: bookingTotalPages }, (_, i) => i + 1).map((p) => (
                      <Pagination.Item
                        key={p}
                        active={p === bookingPage}
                        onClick={() => setBookingPage(p)}
                      >
                        {p}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next
                      disabled={bookingPage === bookingTotalPages}
                      onClick={() => setBookingPage((p) => Math.min(bookingTotalPages, p + 1))}
                    />
                  </Pagination>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card className="shadow-sm border-0 rounded-4 overflow-hidden">
            <Card.Header className="bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 text-dark">Order History</h5>
            </Card.Header>
            <Card.Body className="p-4">
              {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
              ) : orders.length === 0 ? (
                <Alert variant="secondary" className="mb-0">Chưa có order nào.</Alert>
              ) : (
                <Accordion activeKey={activeOrderKey} onSelect={(k) => setActiveOrderKey(k)}>
                  {pagedOrders.map((order) => {
                    const oKey = String(order.id);
                    const relatedBooking = bookingMap.get(String(order.bookingId));
                    return (
                      <Accordion.Item eventKey={oKey} key={oKey} className="mb-3 border rounded-3 overflow-hidden">
                        <Accordion.Header>
                          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center w-100 me-3 gap-2">
                            <div>
                              <div className="fw-bold text-dark">Order #{String(order.id).slice(-6).toUpperCase()}</div>
                              <small className="text-muted">Booking: {relatedBooking?.bookingCode || String(order.bookingId || "--").slice(-6).toUpperCase()}</small>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              {statusBadge(order.status, ORDER_STATUS_MAP)}
                              <Badge bg="info" text="dark" pill>{fmt(order.totalAmount)}đ</Badge>
                            </div>
                          </div>
                        </Accordion.Header>
                        <Accordion.Body className="bg-light">
                          <Row className="g-3 mb-3">
                            <Col md={6}><div className="small text-muted">Mã order</div><div className="fw-semibold">#{String(order.id).slice(-6).toUpperCase()}</div></Col>
                            <Col md={6}><div className="small text-muted">Thời gian tạo</div><div className="fw-semibold">{formatDateTime(order.createdAt)}</div></Col>
                            <Col md={6}><div className="small text-muted">Booking liên quan</div><div className="fw-semibold">{relatedBooking?.bookingCode || "--"}</div></Col>
                            <Col md={6}><div className="small text-muted">Không gian</div><div className="fw-semibold">{relatedBooking?.spaceName || "--"}</div></Col>
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
                                    <td>{fmt(item.priceAtOrder)}đ</td>
                                    <td>{item.note || "-"}</td>
                                    <td className="text-end fw-semibold">{fmt(item.lineTotal)}đ</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {canEditOrder(order.status) && (
                            <Button size="sm" variant="outline-primary" onClick={() => openEditOrder(order)}>
                              <i className="bi bi-pencil-square me-1"></i>Edit order
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => {
                              setInvoiceOrder({ order, relatedBooking });
                              setShowInvoiceModal(true);
                            }}
                          >
                            <i className="bi bi-receipt me-1"></i>Hóa đơn
                          </Button>
                        </Accordion.Body>
                      </Accordion.Item>
                    );
                  })}
                </Accordion>
              )}

              {!loading && orders.length > 0 && (
                <div className="d-flex justify-content-center mt-3">
                  <Pagination className="mb-0">
                    <Pagination.Prev
                      disabled={orderPage === 1}
                      onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                    />
                    {Array.from({ length: orderTotalPages }, (_, i) => i + 1).map((p) => (
                      <Pagination.Item
                        key={p}
                        active={p === orderPage}
                        onClick={() => setOrderPage(p)}
                      >
                        {p}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next
                      disabled={orderPage === orderTotalPages}
                      onClick={() => setOrderPage((p) => Math.min(orderTotalPages, p + 1))}
                    />
                  </Pagination>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>
      </main>

      <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} centered>
        <Form onSubmit={submitBookingUpdate}>
          <Modal.Header closeButton><Modal.Title>Chỉnh sửa booking</Modal.Title></Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}><Form.Label>Họ tên</Form.Label><Form.Control value={bookingForm.guestName} onChange={(e) => setBookingForm((p) => ({ ...p, guestName: e.target.value }))} required /></Col>
              <Col md={6}><Form.Label>Số điện thoại</Form.Label><Form.Control value={bookingForm.guestPhone} onChange={(e) => setBookingForm((p) => ({ ...p, guestPhone: e.target.value }))} required /></Col>
              <Col md={6}><Form.Label>Ngày</Form.Label><Form.Control type="date" value={bookingForm.arrivalDate} onChange={(e) => setBookingForm((p) => ({ ...p, arrivalDate: e.target.value }))} required /></Col>
              <Col md={6}><Form.Label>Giờ</Form.Label><Form.Control type="time" value={bookingForm.arrivalTime} onChange={(e) => setBookingForm((p) => ({ ...p, arrivalTime: e.target.value }))} required /></Col>
              <Col md={6}><Form.Label>Thời lượng (giờ)</Form.Label><Form.Control type="number" min={1} step={1} value={bookingForm.duration} onChange={(e) => setBookingForm((p) => ({ ...p, duration: e.target.value }))} required /></Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowBookingModal(false)}>Hủy</Button>
            <Button type="submit" variant="primary" disabled={savingBooking}>{savingBooking ? "Đang lưu..." : "Lưu booking"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showOrderModal} onHide={() => setShowOrderModal(false)} size="lg" centered>
        <Form onSubmit={submitOrder}>
          <Modal.Header closeButton>
            <Modal.Title>{orderMode === "create" ? "Tạo đơn hàng" : "Cập nhật đơn hàng"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <small className="text-muted">Booking: {targetBookingId ? String(targetBookingId).slice(-6).toUpperCase() : "--"}</small>
              <Button size="sm" variant="outline-primary" onClick={addOrderLine} type="button">
                <i className="bi bi-plus-lg me-1"></i>Thêm món
              </Button>
            </div>

            <Row className="g-2 fw-semibold text-muted small mb-2 px-1">
              <Col md={5}>Món</Col><Col md={2}>Số lượng</Col><Col md={4}>Ghi chú</Col><Col md={1}></Col>
            </Row>

            {orderLines.map((line, idx) => (
              <Row className="g-2 mb-2" key={`${idx}-${line.menuItemId}`}>
                <Col md={5}>
                  <Form.Select value={line.menuItemId} onChange={(e) => updateOrderLine(idx, "menuItemId", e.target.value)} required>
                    <option value="">Chọn món...</option>
                    {menuItems.map((m) => (
                      <option key={m._id} value={m._id}>{m.name} - {fmt(m.price)}đ</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Control type="number" min={1} value={line.quantity} onChange={(e) => updateOrderLine(idx, "quantity", e.target.value)} required />
                </Col>
                <Col md={4}>
                  <Form.Control value={line.note} onChange={(e) => updateOrderLine(idx, "note", e.target.value)} placeholder="Ghi chú" />
                </Col>
                <Col md={1} className="d-grid">
                  <Button type="button" variant="outline-danger" onClick={() => removeOrderLine(idx)}>
                    <i className="bi bi-x-lg"></i>
                  </Button>
                </Col>
              </Row>
            ))}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowOrderModal(false)}>Hủy</Button>
            <Button type="submit" variant="primary" disabled={savingOrder}>{savingOrder ? "Đang lưu..." : "Lưu đơn hàng"}</Button>
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
            <h3 className="fw-bold mb-0">NEXUS COFFEE</h3>
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
              <strong>{BOOKING_STATUS_MAP[invoiceBooking?.status]?.label || invoiceBooking?.status || "--"}</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Số order liên quan</span>
              <strong>{orderCountByBooking.get(String(invoiceBooking?.id || "")) || 0}</strong>
            </div>

            <hr />
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0 text-secondary">TỔNG BOOKING</h5>
              <h3 className="text-primary fw-bold mb-0">
                {fmt(invoiceBooking?.depositAmount)}đ
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
          <Button className="w-100" variant="primary" onClick={() => window.print()}>
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
            <h3 className="fw-bold mb-0">NEXUS COFFEE</h3>
            <div className="text-secondary fw-semibold">HÓA ĐƠN ĐIỆN TỬ</div>
            <hr />
            <div className="fw-bold mb-2">THÔNG TIN ĐƠN HÀNG</div>
            <div className="d-flex justify-content-between">
              <span>Mã đơn</span>
              <strong>
                #{String(invoiceOrder?.order?.id || "").slice(-6).toUpperCase()}
              </strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Ngày tạo</span>
              <strong>{formatDateTime(invoiceOrder?.order?.createdAt)}</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Mã booking</span>
              <strong>{invoiceOrder?.relatedBooking?.bookingCode || "--"}</strong>
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
                <strong>{fmt(item.lineTotal)}đ</strong>
              </div>
            ))}

            <hr />
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0 text-secondary">TỔNG CỘNG</h5>
              <h3 className="text-primary fw-bold mb-0">
                {fmt(invoiceOrder?.order?.totalAmount)}đ
              </h3>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 d-flex gap-2">
          <Button
            variant="outline-secondary"
            className="w-100"
            onClick={() => {
              setShowInvoiceModal(false);
              setInvoiceOrder(null);
            }}
          >
            Đóng
          </Button>
          <Button className="w-100" variant="primary" onClick={() => window.print()}>
            <i className="bi bi-printer me-2"></i>In hóa đơn
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
