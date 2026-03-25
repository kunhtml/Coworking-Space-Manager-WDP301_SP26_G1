import { useEffect, useMemo, useState } from "react";
import { Alert, Col, Container, Row } from "react-bootstrap";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { getBookings, updateBookingApi } from "../../services/bookingService";
import {
  createOrderApi,
  getMyOrders,
  updateOrderApi,
} from "../../services/orderService";
import { apiClient } from "../../services/api";
import GuestCustomerNavbar from "../../components/common/GuestCustomerNavbar";
import InvoicePreviewModal from "../../components/customer/InvoicePreviewModal";
import BookingHistoryPanel from "../../components/customer/cards/BookingHistoryPanel";
import HistoryStatsCards from "../../components/customer/cards/HistoryStatsCards";
import OrderHistoryPanel from "../../components/customer/cards/OrderHistoryPanel";
import EditBookingModal from "../../components/customer/modals/EditBookingModal";
import EditOrderModal from "../../components/customer/modals/EditOrderModal";
import {
  BOOKING_STATUS_MAP,
  ORDER_STATUS_MAP,
  PAYMENT_STATUS_MAP,
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
      content:
        "Theo dõi booking, tạo đơn hàng và cập nhật đơn hàng cho khách hàng.",
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
  const [orderPaymentFilter, setOrderPaymentFilter] = useState("all");

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
  const [lockedOrderItems, setLockedOrderItems] = useState([]);
  const [appendOnlyEditMode, setAppendOnlyEditMode] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [showBookingInvoiceModal, setShowBookingInvoiceModal] = useState(false);
  const [invoiceBooking, setInvoiceBooking] = useState(null);

  const canEditBooking = (status) =>
    !["Confirmed", "Cancelled"].includes(status);
  const normalizeOrderStatus = (rawStatus) => {
    const status = String(rawStatus || "")
      .trim()
      .toUpperCase();
    if (!status) return "PENDING";
    if (status === "NEW") return "PENDING";
    if (status === "PAID") return "COMPLETED";
    if (status === "CANCELED") return "CANCELLED";
    return status;
  };
  const canEditOrder = (status) =>
    !["CONFIRMED", "CANCELLED", "COMPLETED"].includes(
      normalizeOrderStatus(status),
    );

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
      const normalizedOrders = Array.isArray(orderRows)
        ? orderRows.map((order) => ({
            ...order,
            status: normalizeOrderStatus(order?.status),
          }))
        : [];
      setOrders(normalizedOrders);
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
      const byPaymentStatus =
        orderPaymentFilter === "all" ||
        String(order.paymentStatus || "UNPAID") === orderPaymentFilter;
      return byCode && byDate && byStatus && byPaymentStatus;
    });
  }, [
    orders,
    orderSearch,
    orderDateFilter,
    orderStatusFilter,
    orderPaymentFilter,
  ]);

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
  }, [orderSearch, orderDateFilter, orderStatusFilter, orderPaymentFilter]);

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
    setLockedOrderItems([]);
    setAppendOnlyEditMode(false);
    setOrderLines([emptyOrderLine()]);
    setShowOrderModal(true);
  };

  const openEditOrder = (order) => {
    const appendOnly = Boolean(order?.appendOnlyEdit);
    setOrderMode("edit");
    setTargetBookingId(String(order.bookingId));
    setEditingOrderId(String(order.id));
    setAppendOnlyEditMode(appendOnly);
    setLockedOrderItems(appendOnly ? order.items || [] : []);
    setOrderLines(
      appendOnly
        ? [emptyOrderLine()]
        : order.items?.length
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
        await updateOrderApi(editingOrderId, {
          items: payload.items,
          appendOnly: appendOnlyEditMode,
        });
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

  return (
    <div className="d-flex flex-column min-vh-100">
      <GuestCustomerNavbar activeItem="orders" />

      <main className="flex-grow-1 bg-light py-5">
        <Container>
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

          <HistoryStatsCards
            loading={loading}
            total={total}
            pendingCount={pendingCount}
            completedCount={completedCount}
          />

          {error && (
            <Alert variant="danger" className="mb-4">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          <BookingHistoryPanel
            loading={loading}
            bookingSearch={bookingSearch}
            setBookingSearch={setBookingSearch}
            bookingDateFilter={bookingDateFilter}
            setBookingDateFilter={setBookingDateFilter}
            bookingStatusFilter={bookingStatusFilter}
            setBookingStatusFilter={setBookingStatusFilter}
            BOOKING_STATUS_MAP={BOOKING_STATUS_MAP}
            filteredBookings={filteredBookings}
            pagedBookings={pagedBookings}
            activeBookingKey={activeBookingKey}
            setActiveBookingKey={setActiveBookingKey}
            formatDateTime={formatDateTime}
            orderCountByBooking={orderCountByBooking}
            fmt={fmt}
            canEditBooking={canEditBooking}
            openBookingEditor={openBookingEditor}
            setInvoiceBooking={setInvoiceBooking}
            setShowBookingInvoiceModal={setShowBookingInvoiceModal}
            openCreateOrder={openCreateOrder}
            navigate={navigate}
            bookingPage={bookingPage}
            bookingTotalPages={bookingTotalPages}
            setBookingPage={setBookingPage}
          />

          <OrderHistoryPanel
            loading={loading}
            orderSearch={orderSearch}
            setOrderSearch={setOrderSearch}
            orderDateFilter={orderDateFilter}
            setOrderDateFilter={setOrderDateFilter}
            orderStatusFilter={orderStatusFilter}
            setOrderStatusFilter={setOrderStatusFilter}
            orderPaymentFilter={orderPaymentFilter}
            setOrderPaymentFilter={setOrderPaymentFilter}
            ORDER_STATUS_MAP={ORDER_STATUS_MAP}
            PAYMENT_STATUS_MAP={PAYMENT_STATUS_MAP}
            filteredOrders={filteredOrders}
            pagedOrders={pagedOrders}
            activeOrderKey={activeOrderKey}
            setActiveOrderKey={setActiveOrderKey}
            bookingMap={bookingMap}
            formatDateTime={formatDateTime}
            fmt={fmt}
            canEditOrder={canEditOrder}
            openEditOrder={openEditOrder}
            setInvoiceOrder={setInvoiceOrder}
            setShowInvoiceModal={setShowInvoiceModal}
            navigate={navigate}
            orderPage={orderPage}
            orderTotalPages={orderTotalPages}
            setOrderPage={setOrderPage}
          />
        </Container>
      </main>

      <EditBookingModal
        show={showBookingModal}
        onHide={() => setShowBookingModal(false)}
        submitBookingUpdate={submitBookingUpdate}
        bookingForm={bookingForm}
        setBookingForm={setBookingForm}
        savingBooking={savingBooking}
      />

      <EditOrderModal
        show={showOrderModal}
        onHide={() => setShowOrderModal(false)}
        submitOrder={submitOrder}
        orderMode={orderMode}
        targetBookingId={targetBookingId}
        addOrderLine={addOrderLine}
        orderLines={orderLines}
        menuItems={menuItems}
        updateOrderLine={updateOrderLine}
        removeOrderLine={removeOrderLine}
        appendOnlyEditMode={appendOnlyEditMode}
        lockedOrderItems={lockedOrderItems}
        fmt={fmt}
        savingOrder={savingOrder}
      />

      <InvoicePreviewModal
        show={showBookingInvoiceModal}
        onClose={() => {
          setShowBookingInvoiceModal(false);
          setInvoiceBooking(null);
        }}
        onPrint={() => window.print()}
        printLabel="In hóa đơn booking"
      >
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
      </InvoicePreviewModal>

      <InvoicePreviewModal
        show={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false);
          setInvoiceOrder(null);
        }}
        onPrint={() => window.print()}
        printLabel="In hóa đơn"
      >
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
      </InvoicePreviewModal>
    </div>
  );
}
