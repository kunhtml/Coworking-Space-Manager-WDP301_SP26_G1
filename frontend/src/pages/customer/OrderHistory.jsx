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
import GuestCustomerNavbar from "../../components/common/GuestCustomerNavbar";
import StatusPill from "../../components/common/StatusPill";
import ListPagination from "../../components/common/ListPagination";
import {
  BOOKING_STATUS_MAP,
  ORDER_STATUS_MAP,
  PAGE_SIZE,
} from "./orderHistory/constants";
import {
  durationFromRange,
  emptyOrderLine,
  fmt,
  formatDateTime,
  toDateInput,
  toTimeInput,
} from "./orderHistory/utils";

export function meta() {
  return [
    { title: "Đơn hàng & Đặt chỗ | Coworking Space" },
    {
      name: "description",
      content: "Theo dõi booking, tạo đơn hàng và cập nhật đơn hàng cho khách hàng.",
    },
  ];
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
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingDateFilter, setBookingDateFilter] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderDateFilter, setOrderDateFilter] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

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

  const filteredBookings = useMemo(() => {
    const q = bookingSearch.trim().toLowerCase();
    return bookings.filter((booking) => {
      const bookingCode = String(booking.bookingCode || "").toLowerCase();
      const bookingDate = toDateInput(booking.startTime);
      const byCode = !q || bookingCode.includes(q);
      const byDate = !bookingDateFilter || bookingDate === bookingDateFilter;
      const byStatus = bookingStatusFilter === "all" || booking.status === bookingStatusFilter;
      return byCode && byDate && byStatus;
    });
  }, [bookings, bookingSearch, bookingDateFilter, bookingStatusFilter]);

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((order) => {
      const orderCode = String(order.id || "").slice(-6).toUpperCase().toLowerCase();
      const orderDate = toDateInput(order.createdAt);
      const byCode = !q || orderCode.includes(q);
      const byDate = !orderDateFilter || orderDate === orderDateFilter;
      const byStatus = orderStatusFilter === "all" || order.status === orderStatusFilter;
      return byCode && byDate && byStatus;
    });
  }, [orders, orderSearch, orderDateFilter, orderStatusFilter]);

  const bookingTotalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
  const orderTotalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

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
    const exists = filteredBookings.some((b) => String(b.id) === String(activeBookingKey));
    if (!exists) {
      setActiveBookingKey(String(filteredBookings[0].id));
    }
  }, [filteredBookings, activeBookingKey]);

  useEffect(() => {
    if (!filteredOrders.length) {
      setActiveOrderKey(null);
      return;
    }
    const exists = filteredOrders.some((o) => String(o.id) === String(activeOrderKey));
    if (!exists) {
      setActiveOrderKey(String(filteredOrders[0].id));
    }
  }, [filteredOrders, activeOrderKey]);

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
    <div className="d-flex flex-column min-vh-100">
      <GuestCustomerNavbar activeItem="orders" />

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
                      <option key={value} value={value}>{cfg.label}</option>
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
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted mb-3">Không tìm thấy booking phù hợp bộ lọc.</p>
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
                              <StatusPill status={booking.status} map={BOOKING_STATUS_MAP} />
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
                            <Col md={6}><div className="small text-muted">Giá trị booking</div><div className="fw-semibold">{fmt(booking.depositAmount)}d</div></Col>
                            <Col md={6}><div className="small text-muted">Trạng thái</div><div><StatusPill status={booking.status} map={BOOKING_STATUS_MAP} /></div></Col>
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
                      <option key={value} value={value}>{cfg.label}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={1}>
                  <Button
                    variant="outline-secondary"
                    className="w-100"
                    onClick={() => {
                      setOrderSearch("");
                      setOrderDateFilter("");
                      setOrderStatusFilter("all");
                    }}
                  >
                    <i className="bi bi-arrow-counterclockwise"></i>
                  </Button>
                </Col>
              </Row>

              {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
              ) : filteredOrders.length === 0 ? (
                <Alert variant="secondary" className="mb-0">Không tìm thấy order phù hợp bộ lọc.</Alert>
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
                              <StatusPill status={order.status} map={ORDER_STATUS_MAP} />
                              <Badge bg="info" text="dark" pill>{fmt(order.totalAmount)}d</Badge>
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
                                    <td>{fmt(item.priceAtOrder)}d</td>
                                    <td>{item.note || "-"}</td>
                                    <td className="text-end fw-semibold">{fmt(item.lineTotal)}d</td>
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

              {!loading && filteredOrders.length > 0 && (
                <ListPagination
                  page={orderPage}
                  totalPages={orderTotalPages}
                  onChange={setOrderPage}
                />
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
                      <option key={m._id} value={m._id}>{m.name} - {fmt(m.price)}d</option>
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
            <h3 className="fw-bold mb-0">Coworking Space</h3>
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
                <strong>{fmt(item.lineTotal)}d</strong>
              </div>
            ))}

            <hr />
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0 text-secondary">TỔNG CỘNG</h5>
              <h3 className="text-primary fw-bold mb-0">
                {fmt(invoiceOrder?.order?.totalAmount)}d
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

