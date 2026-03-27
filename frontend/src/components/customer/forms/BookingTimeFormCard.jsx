import { Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import { getVietnamDateString } from "../../../utils/timezone";

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
                min={getVietnamDateString()}
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
                onChange={(e) => {
                  const val = e.target.value;
                  if (selectedTimeStart && val) {
                    const [sh, sm] = selectedTimeStart.split(":").map(Number);
                    const [eh, em] = val.split(":").map(Number);
                    if (!isNaN(eh) && !isNaN(em)) {
                      if (eh * 60 + em < sh * 60 + sm + 60 && sh !== 23) {
                        let minH = sh + 1;
                        if (minH > 23) minH = 23;
                        setSelectedTimeEnd(`${minH.toString().padStart(2, "0")}:${sm.toString().padStart(2, "0")}`);
                        return;
                      }
                    }
                  }
                  setSelectedTimeEnd(val);
                }}
                min={(() => {
                  if (!selectedTimeStart) return undefined;
                  const [sh, sm] = selectedTimeStart.split(":").map(Number);
                  let minH = sh + 1;
                  if (minH > 23) minH = 23;
                  return `${minH.toString().padStart(2, "0")}:${sm.toString().padStart(2, "0")}`;
                })()}
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
