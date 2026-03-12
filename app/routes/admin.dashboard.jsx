import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router";

export default function AdminDashboard() {
  return (
    <div className="min-vh-100 bg-black text-light font-monospace py-5">
      <Container>
        <div className="mb-5 border-bottom border-secondary pb-4">
          <h1 className="display-4 fw-bold text-uppercase mb-2">Hệ thống quản lý</h1>
          <p className="text-secondary text-uppercase tracking-widest small">
            Chào mừng quay trở lại, <span className="text-white">Admin</span>
          </p>
        </div>

        {/* Thống kê nhanh */}
        <Row className="g-4 mb-5">
          {[
            { label: "Đơn đặt bàn", value: "24", unit: "hôm nay", color: "text-white" },
            { label: "Doanh thu", value: "15.5M", unit: "VND", color: "text-warning" },
            { label: "Khách mới", value: "+12", unit: "thành viên", color: "text-info" },
            { label: "Bàn trống", value: "08", unit: "vị trí", color: "text-success" },
          ].map((stat, idx) => (
            <Col key={idx} md={3}>
              <div className="p-4 border border-secondary bg-dark h-100">
                <p className="text-secondary small text-uppercase mb-2">{stat.label}</p>
                <h2 className={`display-6 fw-bold mb-0 ${stat.color}`}>{stat.value}</h2>
                <span className="small opacity-50">{stat.unit}</span>
              </div>
            </Col>
          ))}
        </Row>

        <Row className="g-4">
          {/* Lối tắt quản lý */}
          <Col lg={8}>
            <div className="p-4 border border-secondary bg-dark h-100">
              <h5 className="text-uppercase fw-bold mb-4 border-bottom border-secondary pb-3">Truy cập nhanh</h5>
              <Row className="g-3">
                <Col md={6}>
                  <Button as={Link} to="/admin/tables" variant="outline-light" className="w-100 py-4 rounded-0 text-start">
                    <i className="bi bi-grid-3x3-gap me-2"></i> QUẢN LÝ SƠ ĐỒ BÀN
                  </Button>
                </Col>
                <Col md={6}>
                  <Button as={Link} to="/admin/menu" variant="outline-light" className="w-100 py-4 rounded-0 text-start">
                    <i className="bi bi-cup-hot me-2"></i> CẤU HÌNH THỰC ĐƠN
                  </Button>
                </Col>
                <Col md={6}>
                  <Button as={Link} to="/admin/accounts" variant="outline-light" className="w-100 py-4 rounded-0 text-start">
                    <i className="bi bi-people me-2"></i> DANH SÁCH TÀI KHOẢN
                  </Button>
                </Col>
                <Col md={6}>
                  <Button variant="outline-secondary" className="w-100 py-4 rounded-0 text-start text-uppercase fw-bold">
                    <i className="bi bi-gear me-2"></i> CÀI ĐẶT HỆ THỐNG
                  </Button>
                </Col>
              </Row>
            </div>
          </Col>

          {/* Trạng thái hệ thống */}
          <Col lg={4}>
            <div className="p-4 border border-secondary bg-dark">
              <h5 className="text-uppercase fw-bold mb-4">Server Status</h5>
              <div className="d-flex align-items-center mb-3">
                <div className="bg-success rounded-circle me-3" style={{width: '10px', height: '10px'}}></div>
                <span className="small">DATABASE: CONNECTED</span>
              </div>
              <div className="d-flex align-items-center mb-3">
                <div className="bg-success rounded-circle me-3" style={{width: '10px', height: '10px'}}></div>
                <span className="small">AUTH SERVICE: ONLINE</span>
              </div>
              <hr className="border-secondary" />
              <p className="text-secondary small mb-0">Last update: 10/03/2026 08:30:12</p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}