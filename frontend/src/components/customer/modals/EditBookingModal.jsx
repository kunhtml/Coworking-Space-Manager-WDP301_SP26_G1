import { Button, Col, Form, Modal, Row } from "react-bootstrap";

export default function EditBookingModal({
  show,
  onHide,
  submitBookingUpdate,
  bookingForm,
  setBookingForm,
  savingBooking,
}) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={submitBookingUpdate}>
        <Modal.Header closeButton>
          <Modal.Title>Chỉnh sửa booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Label>Họ tên</Form.Label>
              <Form.Control
                value={bookingForm.guestName}
                onChange={(e) => setBookingForm((p) => ({ ...p, guestName: e.target.value }))}
                required
              />
            </Col>
            <Col md={6}>
              <Form.Label>Số điện thoại</Form.Label>
              <Form.Control
                value={bookingForm.guestPhone}
                onChange={(e) => setBookingForm((p) => ({ ...p, guestPhone: e.target.value }))}
                required
              />
            </Col>
            <Col md={6}>
              <Form.Label>Ngày</Form.Label>
              <Form.Control
                type="date"
                value={bookingForm.arrivalDate}
                onChange={(e) => setBookingForm((p) => ({ ...p, arrivalDate: e.target.value }))}
                required
              />
            </Col>
            <Col md={6}>
              <Form.Label>Giờ</Form.Label>
              <Form.Control
                type="time"
                value={bookingForm.arrivalTime}
                onChange={(e) => setBookingForm((p) => ({ ...p, arrivalTime: e.target.value }))}
                required
              />
            </Col>
            <Col md={6}>
              <Form.Label>Thời lượng (giờ)</Form.Label>
              <Form.Control
                type="number"
                min={1}
                step={1}
                value={bookingForm.duration}
                onChange={(e) => setBookingForm((p) => ({ ...p, duration: e.target.value }))}
                required
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Hủy</Button>
          <Button type="submit" variant="primary" disabled={savingBooking}>
            {savingBooking ? "Đang lưu..." : "Lưu booking"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
