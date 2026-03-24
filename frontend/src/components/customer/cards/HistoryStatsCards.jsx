import { Card, Col, Row } from "react-bootstrap";

export default function HistoryStatsCards({ loading, total, pendingCount, completedCount }) {
  return (
    <Row className="g-4 mb-4">
      <Col md={4}>
        <Card className="border-0 shadow-sm rounded-4 h-100">
          <Card.Body className="p-4">
            <h6 className="text-muted mb-1">Tổng booking</h6>
            <h3 className="fw-bold mb-0">{loading ? "-" : total}</h3>
          </Card.Body>
        </Card>
      </Col>
      <Col md={4}>
        <Card className="border-0 shadow-sm rounded-4 h-100">
          <Card.Body className="p-4">
            <h6 className="text-muted mb-1">Chờ thanh toán</h6>
            <h3 className="fw-bold mb-0">{loading ? "-" : pendingCount}</h3>
          </Card.Body>
        </Card>
      </Col>
      <Col md={4}>
        <Card className="border-0 shadow-sm rounded-4 h-100">
          <Card.Body className="p-4">
            <h6 className="text-muted mb-1">Đã hoàn thành</h6>
            <h3 className="fw-bold mb-0">{loading ? "-" : completedCount}</h3>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
