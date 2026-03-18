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
  Spinner,
  Nav,
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
    { title: "Đặt chỗ ngồi | StudySpace" },
    {
      name: "description",
      content:
        "Đặt chỗ ngồi online tại StudySpace. Chọn thời gian, loại chỗ ngồi phù hợp cho việc học tập và làm việc.",
    },
  ];
}

const workspaceTypes = [
  {
    id: "individual",
    title: "Ghế cá nhân",
    description: "Không gian yên tĩnh cho việc học tập và làm việc cá nhân",
    price: 25000,
    capacity: "1 chỗ",
    features: ["0 cầm", "Wi-Fi 5G", "Đèn bàn"],
    icon: "bi-person-workspace",
    color: "rgba(99, 102, 241, 0.1)",
    borderColor: "#6366f1",
    popular: false,
  },
  {
    id: "group4",
    title: "Bàn nhóm (4 chỗ)",
    description: "Thảo luận nhóm, làm project, học nhóm hiệu quả",
    price: 40000,
    capacity: "4 chỗ",
    features: ["4 ổ cắm", "Bảng trắng", "Wi-Fi"],
    icon: "bi-people-fill",
    color: "rgba(251, 191, 36, 0.1)",
    borderColor: "#fbbf24",
    popular: true,
  },
  {
    id: "group6",
    title: "Bàn nhóm (6 chỗ)",
    description: "Bàn lớn dành cho nhóm đông, họp team, workshop nhỏ",
    price: 55000,
    capacity: "6 chỗ",
    features: ["6 ổ cắm", "Màn hình", "Bảng trắng"],
    icon: "bi-people-fill",
    color: "rgba(34, 197, 94, 0.1)",
    borderColor: "#22c55e",
    popular: false,
  },
  {
    id: "meeting8",
    title: "Phòng họp (8 chỗ)",
    description: "Phòng riêng cách âm, máy chiếu, bảng trắng, AC",
    price: 120000,
    capacity: "8 chỗ",
    features: ["Máy chiếu", "AC", "Cách âm"],
    icon: "bi-easel",
    color: "rgba(59, 130, 246, 0.1)",
    borderColor: "#3b82f6",
    popular: false,
  },
  {
    id: "vip10",
    title: "Phòng VIP (10 chỗ)",
    description: "Full option: máy chiếu, loa, bảng, minibar, phục vụ riêng",
    price: 200000,
    capacity: "10 chỗ",
    features: ["VIP", "Minibar", "Phục vụ riêng"],
    icon: "bi-gem",
    color: "rgba(139, 92, 246, 0.1)",
    borderColor: "#8b5cf6",
    popular: false,
  },
];

export default function BookingPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeStart, setSelectedTimeStart] = useState("");
  const [selectedTimeEnd, setSelectedTimeEnd] = useState("");
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

    if (!selectedTable) {
      setError("Vui lòng chọn chỗ ngồi");
      return;
    }

    setBookingLoading(true);
    setError("");

    try {
      const bookingData = {
        tableId: selectedTable._id,
        date: selectedDate,
        startTime: selectedTimeStart,
        endTime: selectedTimeEnd,
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

  return (
    <div className="min-vh-100 bg-light">
      {/* Header Navigation */}
      <Navbar bg="white" expand="lg" className="py-3 shadow-sm border-0">
        <Container>
          <Navbar.Brand
            as={Link}
            to="/"
            className="fw-bold d-flex align-items-center"
          >
            <div
              className="studyspace-logo me-2 d-flex align-items-center justify-content-center rounded-3"
              style={{ background: "#6366f1", width: "40px", height: "40px" }}
            >
              <i className="bi bi-cup-hot-fill text-white"></i>
            </div>
            <span style={{ color: "#1f2937" }}>StudySpace</span>
          </Navbar.Brand>

          <Navbar.Toggle />
          <Navbar.Collapse>
            <Nav className="me-auto ms-5">
              <Nav.Link as={Link} to="/" className="fw-medium text-muted px-3">
                Trang chủ
              </Nav.Link>
              <Nav.Link href="#" className="fw-medium text-primary px-3">
                Đặt chỗ
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/menu"
                className="fw-medium text-muted px-3"
              >
                Thực đơn
              </Nav.Link>
            </Nav>

            <div className="d-flex gap-3 align-items-center">
              <AuthNavActions />
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Hero Section */}
      <section className="py-5 bg-primary text-white">
        <Container>
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
                    ))}
                  </Row>
                </Card.Body>
              </Card>

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
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
