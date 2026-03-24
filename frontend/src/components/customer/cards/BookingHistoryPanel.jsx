import { Accordion, Badge, Button, Card, Col, Row, Spinner } from "react-bootstrap";
import { Link } from "react-router";
import ListPagination from "../../common/ListPagination";
import StatusPill from "../../common/StatusPill";
import HistoryFilterBar from "../forms/HistoryFilterBar";

export default function BookingHistoryPanel({
  loading,
  bookingSearch,
  setBookingSearch,
  bookingDateFilter,
  setBookingDateFilter,
  bookingStatusFilter,
  setBookingStatusFilter,
  BOOKING_STATUS_MAP,
  filteredBookings,
  pagedBookings,
  activeBookingKey,
  setActiveBookingKey,
  formatDateTime,
  orderCountByBooking,
  fmt,
  canEditBooking,
  openBookingEditor,
  setInvoiceBooking,
  setShowBookingInvoiceModal,
  openCreateOrder,
  navigate,
  bookingPage,
  bookingTotalPages,
  setBookingPage,
}) {
  return (
    <Card className="shadow-sm border-0 rounded-4 overflow-hidden mb-4">
      <Card.Header className="bg-white border-bottom py-3 px-4">
        <h5 className="fw-bold mb-0 text-dark">Booking</h5>
      </Card.Header>
      <Card.Body className="p-4">
        <HistoryFilterBar
          search={bookingSearch}
          onSearchChange={setBookingSearch}
          dateFilter={bookingDateFilter}
          onDateChange={setBookingDateFilter}
          statusFilter={bookingStatusFilter}
          onStatusChange={setBookingStatusFilter}
          statusOptions={Object.entries(BOOKING_STATUS_MAP)}
          searchPlaceholder="Tìm theo mã booking..."
          onReset={() => {
            setBookingSearch("");
            setBookingDateFilter("");
            setBookingStatusFilter("all");
          }}
        />

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
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
                      {canEditBooking(booking.status) ? (
                        <Button size="sm" variant="outline-primary" onClick={() => openBookingEditor(booking)}>
                          <i className="bi bi-pencil-square me-1"></i>Edit booking
                        </Button>
                      ) : null}
                      <Button size="sm" variant="outline-secondary" onClick={() => {
                        setInvoiceBooking(booking);
                        setShowBookingInvoiceModal(true);
                      }}>
                        <i className="bi bi-receipt me-1"></i>Hóa đơn
                      </Button>
                      <Button size="sm" variant="primary" onClick={() => openCreateOrder(booking.id)} disabled={booking.status === "Cancelled"}>
                        <i className="bi bi-receipt me-1"></i>Tạo order
                      </Button>
                      {["Pending", "Awaiting_Payment"].includes(booking.status) ? (
                        <Button size="sm" variant="success" onClick={() => navigate(`/payment/${booking.id}`)}>
                          <i className="bi bi-credit-card me-1"></i>Thanh toán booking
                        </Button>
                      ) : null}
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              );
            })}
          </Accordion>
        )}

        {!loading && filteredBookings.length > 0 ? (
          <ListPagination page={bookingPage} totalPages={bookingTotalPages} onChange={setBookingPage} />
        ) : null}
      </Card.Body>
    </Card>
  );
}
