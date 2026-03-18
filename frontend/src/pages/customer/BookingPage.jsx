import { useEffect, useState } from "react";
import {
  Alert,
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Navbar,
  Modal,
  Form,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import AuthNavActions from "../../components/common/AuthNavActions";
import {
  searchAvailableTables,
  createBookingApi,
} from "../../services/bookingService";

export function meta() {
  return [
    { title: "Đặt bàn | Nexus Coffee" },
    {
      name: "description",
      content:
        "Đặt bàn và tìm bàn trống tại Nexus Coffee. Chọn ngày giờ, tìm bàn phù hợp.",
    },
  ];
}

const TABLE_TYPE_MAP = {
  Hot_Desk: "single",
  Dedicated_Desk: "single",
  Group_Table: "group",
  Meeting_Room: "meeting",
  Private_Office: "vip",
};

const typeIcons = {
  single: "bi-person-fill",
  double: "bi-people-fill",
  group: "bi-people-fill",
  bar: "bi-cup-hot-fill",
  sofa: "bi-lamp-fill",
  window: "bi-window",
  meeting: "bi-easel-fill",
  "meeting-lg": "bi-easel-fill",
  community: "bi-globe2",
  vip: "bi-star-fill",
};

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n);

export default function Spaces() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // ── Step 1 form state ──
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [duration, setDuration] = useState(1);

  // ── Step 2: available tables ──
  const [searched, setSearched] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // ── Step 3: confirmation modal ──
  const [selectedTable, setSelectedTable] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Pre-fill user info from auth
  useEffect(() => {
    if (user) {
      setGuestName(user.fullName || "");
      setGuestPhone(user.phone || "");
    }
  }, [user]);

  const totalCost =
    selectedTable && selectedTable.pricePerHour > 0
      ? selectedTable.pricePerHour * duration
      : 0;

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError("");
    setIsSearching(true);
    setSearched(false);
    setSelectedTable(null);
    try {
      const data = await searchAvailableTables({
        arrivalDate,
        arrivalTime,
        duration,
      });
      setAvailableTables(data);
      setSearched(true);
    } catch (err) {
      setSearchError(err.message || "Lỗi khi tìm bàn, vui lòng thử lại.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleBook = async () => {
    if (!selectedTable) return;
    setBookingError("");
    setIsBooking(true);
    try {
      const result = await createBookingApi({
        tableSourceId: selectedTable.sourceId,
        guestName,
        guestPhone,
        arrivalDate,
        arrivalTime,
        duration,
        pricePerHour: selectedTable.pricePerHour || 0,
      });
      // Navigate to payment page
      navigate(`/payment/${result.bookingId}`);
    } catch (err) {
      setBookingError(err.message || "Lỗi đặt bàn, vui lòng thử lại.");
    } finally {
      setIsBooking(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedTable(null);
    setBookingError("");
    setBookingSuccess(null);
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-dark text-light font-monospace">
      {/* Navbar */}
      <Navbar
        expand="lg"
        className="bg-dark border-bottom border-secondary sticky-top py-3"
        variant="dark"
      >
        <Container>
          <Navbar.Brand
            as={Link}
            to="/"
            className="fw-bold text-white fs-4 d-flex align-items-center"
          >
            <i className="bi bi-cup-hot-fill me-2 fs-3"></i>
            NEXUS COFFEE
          </Navbar.Brand>
          <Navbar.Toggle
            aria-controls="basic-navbar-nav"
            className="border-0 shadow-none"
          />
          <Navbar.Collapse id="basic-navbar-nav">
            <div className="ms-auto d-flex flex-column flex-lg-row gap-4 align-items-lg-center mt-3 mt-lg-0">
              <Link
                to="/spaces"
                className="text-decoration-none text-light fw-medium px-2 py-1 hover-primary transition-all text-uppercase"
              >
                Không gian
              </Link>
              <Link
                to="/order-table"
                className="text-decoration-none text-warning fw-bold px-2 py-1 text-uppercase"
              >
                Đặt bàn
              </Link>
              <Link
                to="/menu"
                className="text-decoration-none text-light fw-medium px-2 py-1 hover-primary transition-all text-uppercase"
              >
                Thực đơn
              </Link>
              <AuthNavActions />
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Header */}
      <header className="py-5 bg-black border-bottom border-secondary text-center">
        <Container>
          <h1 className="display-4 fw-bold text-white text-uppercase mb-3">
            <i className="bi bi-calendar-check me-3"></i>
            Đặt bàn
          </h1>
          <p
            className="lead text-secondary mx-auto mb-0"
            style={{ maxWidth: "650px" }}
          >
            Nhập thông tin, tìm bàn trống và xác nhận đặt chỗ chỉ trong vài
            bước.
          </p>
        </Container>
      </header>

      <main className="py-5 flex-grow-1">
        <Container>
          {/* ══════ STEP 1: Booking Info Form ══════ */}
          <Card className="bg-black border-secondary rounded-0 mb-5">
            <Card.Header className="bg-dark border-secondary py-3">
              <h5 className="mb-0 text-white text-uppercase fw-bold">
                <Badge bg="light" text="dark" className="rounded-0 me-2">
                  1
                </Badge>
                Thông tin đặt bàn
              </h5>
            </Card.Header>
            <Card.Body className="p-4">
              <form onSubmit={handleSearch}>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold text-uppercase small text-secondary">
                        Họ và Tên
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Nhập họ và tên"
                        className="rounded-0 bg-dark text-light border-secondary"
                        required
                      />
                      {isAuthenticated && (
                        <Form.Text className="text-secondary">
                          Đã tự điền từ tài khoản đăng nhập.
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold text-uppercase small text-secondary">
                        Số điện thoại
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="Nhập số điện thoại"
                        className="rounded-0 bg-dark text-light border-secondary"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-bold text-uppercase small text-secondary">
                        Ngày đến
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={arrivalDate}
                        onChange={(e) => {
                          setArrivalDate(e.target.value);
                          setSearched(false);
                        }}
                        className="rounded-0 bg-dark text-light border-secondary"
                        style={{ colorScheme: "dark" }}
                        min={new Date().toISOString().slice(0, 10)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-bold text-uppercase small text-secondary">
                        Giờ đến
                      </Form.Label>
                      <Form.Control
                        type="time"
                        value={arrivalTime}
                        onChange={(e) => {
                          setArrivalTime(e.target.value);
                          setSearched(false);
                        }}
                        className="rounded-0 bg-dark text-light border-secondary"
                        style={{ colorScheme: "dark" }}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-bold text-uppercase small text-secondary">
                        Thời gian sử dụng
                      </Form.Label>
                      <Form.Select
                        value={duration}
                        onChange={(e) => {
                          setDuration(Number(e.target.value));
                          setSearched(false);
                        }}
                        className="rounded-0 bg-dark text-light border-secondary"
                        required
                      >
                        {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((h) => (
                          <option key={h} value={h}>
                            {h} tiếng
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                {searchError && (
                  <Alert variant="danger" className="rounded-0 mt-3 mb-0">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {searchError}
                  </Alert>
                )}

                <div className="mt-4 text-center">
                  <Button
                    type="submit"
                    variant="warning"
                    size="lg"
                    className="rounded-0 px-5 py-3 fw-bold text-uppercase text-dark"
                    disabled={
                      isSearching || !guestName.trim() || !guestPhone.trim()
                    }
                  >
                    {isSearching ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        ></span>
                        Đang tìm...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-search me-2"></i>
                        Tìm bàn trống
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card.Body>
          </Card>

          {/* ══════ STEP 2: Available Tables ══════ */}
          {searched && (
            <Card className="bg-black border-secondary rounded-0 mb-5">
              <Card.Header className="bg-dark border-secondary py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 text-white text-uppercase fw-bold">
                  <Badge bg="light" text="dark" className="rounded-0 me-2">
                    2
                  </Badge>
                  Chọn bàn trống
                </h5>
                <Badge
                  bg={availableTables.length > 0 ? "success" : "danger"}
                  className="rounded-0 fs-6"
                >
                  {availableTables.length} bàn trống
                </Badge>
              </Card.Header>
              <Card.Body className="p-4">
                {availableTables.length === 0 ? (
                  <div className="text-center py-5">
                    <i
                      className="bi bi-emoji-frown text-secondary"
                      style={{ fontSize: "3rem" }}
                    ></i>
                    <p className="text-secondary mt-3 mb-0">
                      Không tìm thấy bàn trống trong khung giờ này. Vui lòng thử
                      thời gian khác.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-secondary mb-3">
                      <i className="bi bi-info-circle me-1"></i>
                      Nhấn vào bàn để xem chi tiết và xác nhận đặt bàn.
                    </p>
                    <Row className="g-3">
                      {availableTables.map((table) => {
                        const uiType =
                          TABLE_TYPE_MAP[table.tableType] || "single";
                        const icon = typeIcons[uiType] || "bi-hdd";
                        const costEst =
                          table.pricePerHour > 0
                            ? table.pricePerHour * duration
                            : 0;
                        return (
                          <Col xs={6} sm={4} md={3} lg={2} key={table.sourceId}>
                            <OverlayTrigger
                              placement="top"
                              overlay={
                                <Tooltip>
                                  {table.name} — {table.capacity} chỗ —{" "}
                                  {costEst > 0
                                    ? `${fmt(costEst)}đ / ${duration}h`
                                    : "Miễn phí"}
                                </Tooltip>
                              }
                            >
                              <div
                                className="p-3 border border-success text-center h-100 d-flex flex-column align-items-center justify-content-center"
                                style={{
                                  cursor: "pointer",
                                  backgroundColor: "rgba(25, 135, 84, 0.08)",
                                  minHeight: "175px",
                                  transition: "all 0.2s",
                                }}
                                onClick={() =>
                                  setSelectedTable({ ...table, uiType })
                                }
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    "rgba(25, 135, 84, 0.2)";
                                  e.currentTarget.style.borderColor = "#fff";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    "rgba(25, 135, 84, 0.08)";
                                  e.currentTarget.style.borderColor = "#198754";
                                }}
                              >
                                <i
                                  className={`bi ${icon} mb-2 text-success`}
                                  style={{ fontSize: "1.8rem" }}
                                ></i>
                                <div
                                  className="fw-bold text-white mb-1"
                                  style={{ fontSize: "0.85rem" }}
                                >
                                  {table.name}
                                </div>
                                <small
                                  className="text-secondary mb-1"
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  {table.capacity} chỗ
                                </small>
                                {table.pricePerHour > 0 && (
                                  <small
                                    className="text-warning fw-semibold"
                                    style={{ fontSize: "0.7rem" }}
                                  >
                                    {fmt(table.pricePerHour)}đ/giờ
                                  </small>
                                )}
                                <Badge
                                  bg="success"
                                  className="rounded-0 text-uppercase px-2 py-1 mt-1"
                                  style={{ fontSize: "0.65rem" }}
                                >
                                  <i className="bi bi-check-circle-fill me-1"></i>
                                  Còn trống
                                </Badge>
                              </div>
                            </OverlayTrigger>
                          </Col>
                        );
                      })}
                    </Row>
                  </>
                )}
              </Card.Body>
            </Card>
          )}
        </Container>
      </main>

      {/* Footer */}
      <footer className="bg-black text-secondary py-5 mt-auto border-top border-secondary">
        <Container>
          <Row className="gy-4 align-items-center">
            <Col md={4} className="text-center text-md-start">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start mb-3">
                <i className="bi bi-cup-hot-fill me-2 fs-4 text-white"></i>
                <span className="fw-bold text-white fs-5">NEXUS COFFEE</span>
              </div>
              <p className="small mb-0">
                © 2026 NEXUS COFFEE. ALL RIGHTS RESERVED.
              </p>
            </Col>
            <Col md={8} className="text-center text-md-end">
              <div className="d-flex gap-4 justify-content-center justify-content-md-end">
                <a
                  href="#"
                  className="text-secondary text-decoration-none hover-white transition-all text-uppercase small fw-bold"
                >
                  Facebook
                </a>
                <a
                  href="#"
                  className="text-secondary text-decoration-none hover-white transition-all text-uppercase small fw-bold"
                >
                  Instagram
                </a>
                <a
                  href="#"
                  className="text-secondary text-decoration-none hover-white transition-all text-uppercase small fw-bold"
                >
                  Tiktok
                </a>
              </div>
            </Col>
          </Row>
        </Container>
      </footer>

      {/* ══════ STEP 3: Confirmation Modal ══════ */}
      <Modal
        show={!!selectedTable}
        onHide={handleCloseModal}
        centered
        className="font-monospace"
        data-bs-theme="dark"
      >
        <Modal.Header
          closeButton
          className="bg-dark text-light border-secondary rounded-0 border-bottom"
        >
          <Modal.Title className="text-uppercase fw-bold">
            <i className="bi bi-receipt me-2"></i>
            Xác nhận đặt bàn
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-light p-4">
          {selectedTable && (
            <div>
              {/* Table info card */}
              <div
                className="p-4 mb-4 border border-success text-center"
                style={{ backgroundColor: "rgba(25, 135, 84, 0.1)" }}
              >
                <i
                  className={`bi ${typeIcons[selectedTable.uiType] || "bi-hdd"} text-success mb-2`}
                  style={{ fontSize: "2.5rem" }}
                ></i>
                <h4 className="text-white fw-bold mb-1">
                  {selectedTable.name}
                </h4>
                <p className="text-secondary mb-0">
                  <i className="bi bi-people-fill me-1"></i>
                  {selectedTable.capacity} chỗ ngồi
                </p>
              </div>

              {bookingSuccess ? (
                /* Success state */
                <div className="text-center">
                  <i
                    className="bi bi-check-circle-fill text-success mb-3"
                    style={{ fontSize: "3rem" }}
                  ></i>
                  <p className="text-success fw-bold fs-5">
                    Đặt bàn thành công!
                  </p>
                  <p className="text-secondary">
                    Mã đặt bàn:{" "}
                    <span className="text-white fw-bold">{bookingSuccess}</span>
                  </p>
                  <div className="d-flex gap-2 mt-3">
                    <Button
                      variant="outline-light"
                      className="flex-fill rounded-0 fw-bold text-uppercase"
                      onClick={() => navigate("/dashboard")}
                    >
                      Xem lịch đặt bàn
                    </Button>
                    <Button
                      variant="light"
                      className="flex-fill rounded-0 fw-bold text-uppercase"
                      onClick={handleCloseModal}
                    >
                      Đóng
                    </Button>
                  </div>
                </div>
              ) : (
                /* Booking form / summary */
                <>
                  {/* Summary table */}
                  <div
                    className="p-3 mb-4 border border-secondary"
                    style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                  >
                    <table className="w-100 small">
                      <tbody>
                        <tr>
                          <td className="text-secondary py-1">Khách hàng:</td>
                          <td className="text-end text-white fw-bold py-1">
                            {guestName}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-secondary py-1">
                            Số điện thoại:
                          </td>
                          <td className="text-end text-white fw-bold py-1">
                            {guestPhone}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-secondary py-1">Ngày đến:</td>
                          <td className="text-end text-white fw-bold py-1">
                            {arrivalDate
                              ? new Date(
                                  arrivalDate + "T00:00:00",
                                ).toLocaleDateString("vi-VN")
                              : ""}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-secondary py-1">Giờ đến:</td>
                          <td className="text-end text-white fw-bold py-1">
                            {arrivalTime}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-secondary py-1">
                            Thời gian sử dụng:
                          </td>
                          <td className="text-end text-white fw-bold py-1">
                            {duration} tiếng
                          </td>
                        </tr>
                        {selectedTable.pricePerHour > 0 && (
                          <tr>
                            <td className="text-secondary py-1">
                              Giá mỗi giờ:
                            </td>
                            <td className="text-end text-white fw-bold py-1">
                              {fmt(selectedTable.pricePerHour)}đ
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    <hr className="border-secondary my-2" />
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-warning fw-bold text-uppercase">
                        Tổng tiền đặt cọc:
                      </span>
                      <span className="text-warning fw-bold fs-4">
                        {totalCost > 0 ? `${fmt(totalCost)}đ` : "Miễn phí"}
                      </span>
                    </div>
                  </div>

                  {bookingError && (
                    <Alert variant="danger" className="rounded-0 mb-3">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {bookingError}
                    </Alert>
                  )}

                  {!isAuthenticated && (
                    <Alert variant="warning" className="rounded-0 mb-3">
                      <i className="bi bi-exclamation-circle me-2"></i>
                      Bạn cần{" "}
                      <Link to="/login" className="fw-bold">
                        đăng nhập
                      </Link>{" "}
                      để hoàn tất đặt bàn.
                    </Alert>
                  )}

                  <div className="d-flex gap-3">
                    <Button
                      variant="outline-secondary"
                      className="flex-fill rounded-0 fw-bold text-uppercase py-3"
                      onClick={handleCloseModal}
                      disabled={isBooking}
                    >
                      <i className="bi bi-arrow-left me-2"></i>
                      Quay trở lại
                    </Button>
                    <Button
                      variant="success"
                      className="flex-fill rounded-0 fw-bold text-uppercase py-3"
                      onClick={handleBook}
                      disabled={isBooking || !isAuthenticated}
                    >
                      {isBooking ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          ></span>
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-2"></i>
                          Xác nhận đặt bàn
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
