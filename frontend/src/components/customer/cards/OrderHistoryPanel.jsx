import {
  Accordion,
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Row,
  Spinner,
} from "react-bootstrap";
import ListPagination from "../../common/ListPagination";
import StatusPill from "../../common/StatusPill";
import OrderItemsTable from "../tables/OrderItemsTable";

export default function OrderHistoryPanel({
  loading,
  orderSearch,
  setOrderSearch,
  orderDateFilter,
  setOrderDateFilter,
  orderStatusFilter,
  setOrderStatusFilter,
  orderPaymentFilter,
  setOrderPaymentFilter,
  ORDER_STATUS_MAP,
  PAYMENT_STATUS_MAP,
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
  navigate,
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
        <Row className="g-3 mb-3">
          <Col md={4}>
            <input
              placeholder="Tìm theo mã order..."
              className="form-control"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
            />
          </Col>
          <Col md={3}>
            <input
              className="form-control"
              type="date"
              value={orderDateFilter}
              onChange={(e) => setOrderDateFilter(e.target.value)}
            />
          </Col>
          <Col md={2}>
            <select
              className="form-select"
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              {Object.entries(ORDER_STATUS_MAP).map(([value, cfg]) => (
                <option key={value} value={value}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </Col>
          <Col md={2}>
            <select
              className="form-select"
              value={orderPaymentFilter}
              onChange={(e) => setOrderPaymentFilter(e.target.value)}
            >
              <option value="all">Thanh toán: tất cả</option>
              {Object.entries(PAYMENT_STATUS_MAP).map(([value, cfg]) => (
                <option key={value} value={value}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </Col>
          <Col md={1}>
            <Button
              variant="outline-secondary"
              className="w-100"
              onClick={() => {
                setOrderSearch("");
                setOrderDateFilter("");
                setOrderStatusFilter("all");
                setOrderPaymentFilter("all");
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
              const relatedBooking = bookingMap.get(String(order.bookingId));
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
                          Order #{String(order.id).slice(-6).toUpperCase()}
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
                        <StatusPill
                          status={order.paymentStatus || "UNPAID"}
                          map={PAYMENT_STATUS_MAP}
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
                        <div className="small text-muted">Thời gian tạo</div>
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
                      <Col md={6}>
                        <div className="small text-muted">Thanh toán</div>
                        <div>
                          <StatusPill
                            status={order.paymentStatus || "UNPAID"}
                            map={PAYMENT_STATUS_MAP}
                          />
                        </div>
                      </Col>
                    </Row>

                    <OrderItemsTable items={order.items || []} fmt={fmt} />

                    {canEditOrder(order.status) ? (
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => openEditOrder(order)}
                      >
                        <i className="bi bi-pencil-square me-1"></i>Edit order
                      </Button>
                    ) : null}
                    {order.paymentStatus !== "PAID" &&
                    order.paymentStatus !== "CANCELLED" ? (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => navigate(`/payment/order/${order.id}`)}
                      >
                        <i className="bi bi-qr-code me-1"></i>Tạo QR thanh toán
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
          <ListPagination
            page={orderPage}
            totalPages={orderTotalPages}
            onChange={setOrderPage}
          />
        ) : null}
      </Card.Body>
    </Card>
  );
}
