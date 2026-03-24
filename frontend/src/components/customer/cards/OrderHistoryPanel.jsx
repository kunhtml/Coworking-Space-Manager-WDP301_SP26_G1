import { Accordion, Alert, Badge, Button, Card, Col, Row, Spinner } from "react-bootstrap";
import ListPagination from "../../common/ListPagination";
import StatusPill from "../../common/StatusPill";
import HistoryFilterBar from "../forms/HistoryFilterBar";
import OrderItemsTable from "../tables/OrderItemsTable";

export default function OrderHistoryPanel({
  loading,
  orderSearch,
  setOrderSearch,
  orderDateFilter,
  setOrderDateFilter,
  orderStatusFilter,
  setOrderStatusFilter,
  ORDER_STATUS_MAP,
  filteredOrders,
  pagedOrders,
  activeOrderKey,
  setActiveOrderKey,
  bookingMap,
  formatDateTime,
  fmt,
  canEditOrder,
  openEditOrder,
  setInvoiceOrder,
  setShowInvoiceModal,
  orderPage,
  orderTotalPages,
  setOrderPage,
}) {
  return (
    <Card className="shadow-sm border-0 rounded-4 overflow-hidden">
      <Card.Header className="bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
        <h5 className="fw-bold mb-0 text-dark">Order History</h5>
      </Card.Header>
      <Card.Body className="p-4">
        <HistoryFilterBar
          search={orderSearch}
          onSearchChange={setOrderSearch}
          dateFilter={orderDateFilter}
          onDateChange={setOrderDateFilter}
          statusFilter={orderStatusFilter}
          onStatusChange={setOrderStatusFilter}
          statusOptions={Object.entries(ORDER_STATUS_MAP)}
          searchPlaceholder="Tìm theo mã order..."
          onReset={() => {
            setOrderSearch("");
            setOrderDateFilter("");
            setOrderStatusFilter("all");
          }}
        />

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
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
                        <small className="text-muted">
                          Booking: {relatedBooking?.bookingCode || String(order.bookingId || "--").slice(-6).toUpperCase()}
                        </small>
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

                    <OrderItemsTable items={order.items || []} fmt={fmt} />

                    {canEditOrder(order.status) ? (
                      <Button size="sm" variant="outline-primary" onClick={() => openEditOrder(order)}>
                        <i className="bi bi-pencil-square me-1"></i>Edit order
                      </Button>
                    ) : null}
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

        {!loading && filteredOrders.length > 0 ? (
          <ListPagination page={orderPage} totalPages={orderTotalPages} onChange={setOrderPage} />
        ) : null}
      </Card.Body>
    </Card>
  );
}
