import { Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";

export default function BookingTimeFormCard({
  selectedDate,
  setSelectedDate,
  selectedTimeStart,
  setSelectedTimeStart,
  selectedTimeEnd,
  setSelectedTimeEnd,
  handleSearch,
  loading,
}) {
  return (
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
              <Form.Label className="fw-semibold">Ngày đặt</Form.Label>
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
              <Form.Label className="fw-semibold">Giờ bắt đầu</Form.Label>
              <Form.Control
                type="time"
                value={selectedTimeStart}
                onChange={(e) => setSelectedTimeStart(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label className="fw-semibold">Giờ kết thúc</Form.Label>
              <Form.Control
                type="time"
                value={selectedTimeEnd}
                onChange={(e) => setSelectedTimeEnd(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>

        <div className="mt-4">
          <Button variant="primary" size="lg" className="px-5" onClick={handleSearch} disabled={loading}>
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
  );
}
