import { Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";

export default function ProfileEditFormCard({
  profileData,
  handleInputChange,
  handleUpdateProfile,
  loadingProfile,
  emailOtp,
  setEmailOtp,
  emailOtpVerified,
  emailOtpRequested,
  emailOtpCooldown,
  emailOtpSending,
  emailOtpVerifying,
  handleSendEmailOtp,
  handleVerifyEmailOtp,
  originalEmail,
}) {
  const emailChanged =
    String(profileData.email || "")
      .trim()
      .toLowerCase() !==
    String(originalEmail || "")
      .trim()
      .toLowerCase();
  const emailRegex =
    /^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*@[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)+$/;
  const isEmailFormatValid = emailRegex.test(
    String(profileData.email || "").trim(),
  );

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
              <Form.Label className="fw-semibold">Số điện thoại</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={profileData.phone}
                onChange={handleInputChange}
                placeholder="Nhập số điện thoại"
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
                isInvalid={emailChanged && !isEmailFormatValid}
              />
              {emailChanged && !isEmailFormatValid && (
                <Form.Text className="text-danger">
                  Email chưa đúng định dạng.
                </Form.Text>
              )}
              {emailChanged && isEmailFormatValid && (
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline-primary"
                    onClick={handleSendEmailOtp}
                    disabled={emailOtpSending || emailOtpCooldown > 0}
                  >
                    {emailOtpSending ? (
                      <Spinner animation="border" size="sm" />
                    ) : emailOtpCooldown > 0 ? (
                      `Gửi lại (${emailOtpCooldown}s)`
                    ) : (
                      "Gửi OTP"
                    )}
                  </Button>
                </div>
              )}
              {emailOtpRequested && (
                <>
                  <div className="d-flex gap-2 mt-2">
                    <Form.Control
                      type="text"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      placeholder="Nhập OTP 6 số"
                      maxLength={6}
                    />
                    <Button
                      type="button"
                      variant={emailOtpVerified ? "success" : "primary"}
                      onClick={handleVerifyEmailOtp}
                      disabled={emailOtpVerified || emailOtpVerifying}
                    >
                      {emailOtpVerifying ? (
                        <Spinner animation="border" size="sm" />
                      ) : emailOtpVerified ? (
                        "Đã xác nhận"
                      ) : (
                        "Xác nhận OTP"
                      )}
                    </Button>
                  </div>
                  <Form.Text
                    className={emailOtpVerified ? "text-success" : "text-muted"}
                  >
                    {emailOtpVerified
                      ? "Email mới đã được xác thực OTP."
                      : "Hãy vào địa chỉ email đó để lấy mã OTP"}
                  </Form.Text>
                </>
              )}
            </Col>
          </Row>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button
              type="submit"
              className="staff-secondary-btn px-4"
              style={{
                backgroundColor: "#6366f1",
                border: "none",
                color: "#fff",
              }}
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
