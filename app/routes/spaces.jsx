import { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Navbar,
  Modal,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { Link } from "react-router";

export function meta() {
  return [
    { title: "Sơ đồ không gian | Nexus Coffee" },
    {
      name: "description",
      content:
        "Xem sơ đồ bàn và không gian tại Nexus Coffee. Chọn bàn trống để đặt chỗ ngay.",
    },
  ];
}

const floors = [
  {
    id: 1,
    name: "Tầng 1 - Quầy bar & Sảnh",
    tables: [
      { id: "T1-01", name: "Bàn đơn 01", seats: 1, type: "single", status: "available" },
      { id: "T1-02", name: "Bàn đơn 02", seats: 1, type: "single", status: "available" },
      { id: "T1-03", name: "Bàn đôi 03", seats: 2, type: "double", status: "booked" },
      { id: "T1-04", name: "Bàn đôi 04", seats: 2, type: "double", status: "available" },
      { id: "T1-05", name: "Bàn nhóm 05", seats: 4, type: "group", status: "maintenance" },
      { id: "T1-06", name: "Bàn nhóm 06", seats: 4, type: "group", status: "booked" },
      { id: "T1-07", name: "Bàn bar 07", seats: 1, type: "bar", status: "available" },
      { id: "T1-08", name: "Bàn bar 08", seats: 1, type: "bar", status: "booked" },
      { id: "T1-09", name: "Bàn bar 09", seats: 1, type: "bar", status: "available" },
      { id: "T1-10", name: "Bàn sofa 10", seats: 3, type: "sofa", status: "available" },
    ],
  },
  {
    id: 2,
    name: "Tầng 2 - Không gian yên tĩnh",
    tables: [
      { id: "T2-01", name: "Bàn cửa sổ 01", seats: 2, type: "window", status: "booked" },
      { id: "T2-02", name: "Bàn cửa sổ 02", seats: 2, type: "window", status: "available" },
      { id: "T2-03", name: "Bàn đơn 03", seats: 1, type: "single", status: "available" },
      { id: "T2-04", name: "Bàn đơn 04", seats: 1, type: "single", status: "booked" },
      { id: "T2-05", name: "Bàn cửa sổ 05", seats: 2, type: "window", status: "available" },
      { id: "T2-06", name: "Bàn nhóm 06", seats: 6, type: "group", status: "available" },
      { id: "T2-07", name: "Bàn đôi 07", seats: 2, type: "double", status: "maintenance" },
      { id: "T2-08", name: "Bàn đơn 08", seats: 1, type: "single", status: "available" },
    ],
  },
  {
    id: 3,
    name: "Tầng 3 - Phòng họp & Sự kiện",
    tables: [
      { id: "T3-01", name: "Phòng họp nhỏ A", seats: 6, type: "meeting", status: "booked" },
      { id: "T3-02", name: "Phòng họp nhỏ B", seats: 6, type: "meeting", status: "available" },
      { id: "T3-03", name: "Phòng họp lớn", seats: 12, type: "meeting-lg", status: "available" },
      { id: "T3-04", name: "Bàn cộng đồng", seats: 8, type: "community", status: "maintenance" },
      { id: "T3-05", name: "Phòng riêng VIP", seats: 4, type: "vip", status: "booked" },
      { id: "T3-06", name: "Bàn đơn 06", seats: 1, type: "single", status: "available" },
    ],
  },
];

const statusConfig = {
  available: { label: "Còn trống", bg: "success", icon: "bi-check-circle-fill" },
  booked: { label: "Đã đặt", bg: "danger", icon: "bi-x-circle-fill" },
  maintenance: { label: "Bảo trì", bg: "warning", icon: "bi-tools" },
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

export default function Spaces() {
  const [activeFloor, setActiveFloor] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTable, setSelectedTable] = useState(null);

  const currentFloor = floors.find((f) => f.id === activeFloor);

  const filteredTables = currentFloor.tables.filter(
    (t) => filterStatus === "all" || t.status === filterStatus
  );

  const stats = {
    available: currentFloor.tables.filter((t) => t.status === "available").length,
    booked: currentFloor.tables.filter((t) => t.status === "booked").length,
    maintenance: currentFloor.tables.filter((t) => t.status === "maintenance").length,
    total: currentFloor.tables.length,
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
                className="text-decoration-none text-warning fw-bold px-2 py-1 text-uppercase"
              >
                Không gian
              </Link>
              <Link
                to="/menu"
                className="text-decoration-none text-light fw-medium px-2 py-1 hover-primary transition-all text-uppercase"
              >
                Thực đơn
              </Link>
              <div className="d-flex gap-2 ms-lg-3 mt-2 mt-lg-0">
                <Button
                  as={Link}
                  to="/login"
                  variant="outline-secondary"
                  className="px-4 rounded-0 fw-medium text-uppercase text-light border-secondary"
                >
                  Đăng nhập
                </Button>
              </div>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Header */}
      <header className="py-5 bg-black border-bottom border-secondary text-center">
        <Container>
          <h1 className="display-4 fw-bold text-white text-uppercase mb-3">
            Sơ đồ không gian
          </h1>
          <p
            className="lead text-secondary mx-auto mb-0"
            style={{ maxWidth: "650px" }}
          >
            Chọn tầng, xem bàn trống và đặt chỗ yêu thích của bạn ngay lập tức.
          </p>
        </Container>
      </header>

      {/* Main content */}
      <main className="py-5 flex-grow-1">
        <Container>
          {/* Floor tabs */}
          <div className="d-flex flex-wrap gap-2 mb-4">
            {floors.map((floor) => (
              <Button
                key={floor.id}
                variant={activeFloor === floor.id ? "light" : "outline-secondary"}
                className={`rounded-0 px-4 py-2 fw-bold text-uppercase ${
                  activeFloor === floor.id ? "text-dark" : "text-light"
                }`}
                onClick={() => {
                  setActiveFloor(floor.id);
                  setFilterStatus("all");
                }}
              >
                {floor.name}
              </Button>
            ))}
          </div>

          {/* Stats cards */}
          <Row className="g-3 mb-4">
            <Col xs={6} md={3}>
              <Card
                className={`border-0 rounded-0 text-center ${
                  filterStatus === "all"
                    ? "bg-light text-dark"
                    : "bg-black border border-secondary text-light"
                }`}
                style={{ cursor: "pointer" }}
                onClick={() => setFilterStatus("all")}
              >
                <Card.Body className="py-3">
                  <h3 className="fw-bold mb-1">{stats.total}</h3>
                  <small className="text-uppercase fw-bold" style={{ letterSpacing: "0.05em" }}>
                    Tổng số bàn
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={3}>
              <Card
                className={`border-0 rounded-0 text-center ${
                  filterStatus === "available"
                    ? "bg-success text-white"
                    : "bg-black border border-secondary text-light"
                }`}
                style={{ cursor: "pointer" }}
                onClick={() =>
                  setFilterStatus(filterStatus === "available" ? "all" : "available")
                }
              >
                <Card.Body className="py-3">
                  <h3 className="fw-bold mb-1">{stats.available}</h3>
                  <small className="text-uppercase fw-bold" style={{ letterSpacing: "0.05em" }}>
                    <i className="bi bi-check-circle-fill me-1"></i>Còn trống
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={3}>
              <Card
                className={`border-0 rounded-0 text-center ${
                  filterStatus === "booked"
                    ? "bg-danger text-white"
                    : "bg-black border border-secondary text-light"
                }`}
                style={{ cursor: "pointer" }}
                onClick={() =>
                  setFilterStatus(filterStatus === "booked" ? "all" : "booked")
                }
              >
                <Card.Body className="py-3">
                  <h3 className="fw-bold mb-1">{stats.booked}</h3>
                  <small className="text-uppercase fw-bold" style={{ letterSpacing: "0.05em" }}>
                    <i className="bi bi-x-circle-fill me-1"></i>Đã đặt
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={3}>
              <Card
                className={`border-0 rounded-0 text-center ${
                  filterStatus === "maintenance"
                    ? "bg-warning text-dark"
                    : "bg-black border border-secondary text-light"
                }`}
                style={{ cursor: "pointer" }}
                onClick={() =>
                  setFilterStatus(filterStatus === "maintenance" ? "all" : "maintenance")
                }
              >
                <Card.Body className="py-3">
                  <h3 className="fw-bold mb-1">{stats.maintenance}</h3>
                  <small className="text-uppercase fw-bold" style={{ letterSpacing: "0.05em" }}>
                    <i className="bi bi-tools me-1"></i>Bảo trì
                  </small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Legend */}
          <div className="d-flex flex-wrap gap-4 mb-4 pb-3 border-bottom border-secondary">
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <div key={key} className="d-flex align-items-center gap-2">
                <div
                  className={`bg-${cfg.bg} rounded-circle`}
                  style={{ width: "12px", height: "12px" }}
                ></div>
                <small className="text-secondary text-uppercase fw-bold">
                  {cfg.label}
                </small>
              </div>
            ))}
          </div>

          {/* Table grid */}
          <Row className="g-3">
            {filteredTables.map((table) => {
              const cfg = statusConfig[table.status];
              const icon = typeIcons[table.type] || "bi-hdd";
              return (
                <Col xs={6} sm={4} md={3} lg={2} key={table.id}>
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip>
                        {table.name} — {table.seats} chỗ ngồi — {cfg.label}
                      </Tooltip>
                    }
                  >
                    <div
                      className={`p-3 border text-center h-100 d-flex flex-column align-items-center justify-content-center transition-all ${
                        table.status === "available"
                          ? "border-success hover-bg-dark"
                          : table.status === "booked"
                            ? "border-danger"
                            : "border-warning"
                      }`}
                      style={{
                        cursor: table.status === "available" ? "pointer" : "default",
                        backgroundColor:
                          table.status === "available"
                            ? "rgba(25, 135, 84, 0.08)"
                            : table.status === "booked"
                              ? "rgba(220, 53, 69, 0.08)"
                              : "rgba(255, 193, 7, 0.08)",
                        minHeight: "140px",
                        opacity: table.status === "maintenance" ? 0.6 : 1,
                      }}
                      onClick={() => {
                        if (table.status === "available") {
                          setSelectedTable(table);
                        }
                      }}
                    >
                      <i
                        className={`bi ${icon} mb-2 text-${cfg.bg}`}
                        style={{ fontSize: "1.8rem" }}
                      ></i>
                      <div
                        className="fw-bold text-white mb-1"
                        style={{ fontSize: "0.85rem" }}
                      >
                        {table.id}
                      </div>
                      <small className="text-secondary mb-2" style={{ fontSize: "0.75rem" }}>
                        {table.seats} chỗ
                      </small>
                      <Badge
                        bg={cfg.bg}
                        className={`rounded-0 text-uppercase px-2 py-1 ${
                          table.status === "maintenance" ? "text-dark" : ""
                        }`}
                        style={{ fontSize: "0.65rem" }}
                      >
                        <i className={`bi ${cfg.icon} me-1`}></i>
                        {cfg.label}
                      </Badge>
                    </div>
                  </OverlayTrigger>
                </Col>
              );
            })}
          </Row>

          {filteredTables.length === 0 && (
            <div className="text-center py-5">
              <i className="bi bi-emoji-neutral text-secondary" style={{ fontSize: "3rem" }}></i>
              <p className="text-secondary mt-3">
                Không có bàn nào ở trạng thái này trên tầng hiện tại.
              </p>
            </div>
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

      {/* Modal đặt bàn */}
      <Modal
        show={!!selectedTable}
        onHide={() => setSelectedTable(null)}
        centered
        className="font-monospace"
        data-bs-theme="dark"
      >
        <Modal.Header
          closeButton
          className="bg-dark text-light border-secondary rounded-0 border-bottom"
        >
          <Modal.Title className="text-uppercase fw-bold">
            <i className="bi bi-calendar-check me-2"></i>
            Xác nhận đặt bàn
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-light p-4">
          {selectedTable && (
            <div>
              <div
                className="p-4 mb-4 border border-success text-center"
                style={{ backgroundColor: "rgba(25, 135, 84, 0.1)" }}
              >
                <i
                  className={`bi ${typeIcons[selectedTable.type] || "bi-hdd"} text-success mb-2`}
                  style={{ fontSize: "2.5rem" }}
                ></i>
                <h4 className="text-white fw-bold mb-1">{selectedTable.name}</h4>
                <p className="text-secondary mb-1">Mã bàn: {selectedTable.id}</p>
                <p className="text-secondary mb-0">
                  <i className="bi bi-people-fill me-1"></i>
                  {selectedTable.seats} chỗ ngồi
                </p>
              </div>
              <p className="text-secondary text-center mb-4">
                Bạn cần đăng nhập để đặt bàn này. Nhấn nút bên dưới để tiếp tục.
              </p>
              <Button
                as={Link}
                to="/login"
                variant="light"
                className="w-100 rounded-0 fw-bold text-uppercase py-3"
              >
                Đăng nhập để đặt bàn
              </Button>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
