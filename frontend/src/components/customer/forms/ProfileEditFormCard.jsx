import { Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";

export default function ProfileEditFormCard({
  profileData,
  handleInputChange,
  handleUpdateProfile,
  loadingProfile,
}) {
  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Header className="bg-white border-bottom py-3">
        <h5 className="fw-bold mb-0">
          <i className="bi bi-pencil-fill text-primary me-2"></i>
          Chỉnh sửa thông tin
        </h5>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleUpdateProfile}>
          <Row className="g-3">
            <Col md={12}>
              <Form.Label className="fw-semibold">Họ và tên</Form.Label>
              <Form.Control
                name="fullName"
                value={profileData.fullName}
                onChange={handleInputChange}
                placeholder="Nhập họ và tên"
                required
              />
            </Col>
            <Col md={6}>
              <Form.Label className="fw-semibold">Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleInputChange}
                placeholder="Nhập email"
                required
              />
            </Col>
            <Col md={6}>
              <Form.Label className="fw-semibold">Số điện thoại</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={profileData.phone}
                onChange={handleInputChange}
                placeholder="Nhập số điện thoại"
              />
            </Col>
          </Row>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button
              type="submit"
              className="staff-secondary-btn px-4"
              style={{ backgroundColor: "#6366f1", border: "none", color: "#fff" }}
              disabled={loadingProfile}
            >
              {loadingProfile ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <>
                  <i className="bi bi-floppy me-2"></i>Lưu thông tin
                </>
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
