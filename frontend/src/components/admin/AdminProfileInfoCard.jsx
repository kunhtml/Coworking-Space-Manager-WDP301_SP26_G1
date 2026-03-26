import { Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";

export default function AdminProfileInfoCard({
  editMode,
  setEditMode,
  updateLoading,
  handleUpdateProfile,
  cancelEdit,
  fullName,
  setFullName,
  email,
  setEmail,
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
  phone,
  setPhone,
  profile,
  roleInfo,
}) {
  const emailChanged =
    String(email || "")
      .trim()
      .toLowerCase() !==
    String(originalEmail || "")
      .trim()
      .toLowerCase();
  const emailRegex =
    /^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*@[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)+$/;
  const isEmailFormatValid = emailRegex.test(String(email || "").trim());

  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Header className="bg-white border-0 pb-0">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-semibold">
            <i className="bi bi-person-lines-fill text-primary me-2"></i>
            Thong tin co ban
          </h5>
          {!editMode ? (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setEditMode(true)}
            >
              <i className="bi bi-pencil me-1"></i>Chinh sua
            </Button>
          ) : (
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={cancelEdit}
                disabled={updateLoading}
              >
                Huy
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleUpdateProfile}
                disabled={updateLoading}
              >
                {updateLoading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <>
                    <i className="bi bi-check-lg me-1"></i>Luu
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </Card.Header>
      <Card.Body className="pt-4">
        {editMode ? (
          <Form onSubmit={handleUpdateProfile}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Ho va ten <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">So dien thoai</Form.Label>
                  <Form.Control
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                        className={
                          emailOtpVerified ? "text-success" : "text-muted"
                        }
                      >
                        {emailOtpVerified
                          ? "Email mới đã được xác thực OTP."
                          : "Hãy vào địa chỉ email đó để lấy mã OTP"}
                      </Form.Text>
                    </>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </Form>
        ) : (
          <Row className="g-4">
            <Col md={6}>
              <label className="form-label fw-semibold text-muted small">
                HO VA TEN
              </label>
              <p className="mb-0 fw-medium">
                {profile.fullName || "Chua cap nhat"}
              </p>
            </Col>
            <Col md={6}>
              <label className="form-label fw-semibold text-muted small">
                EMAIL
              </label>
              <p className="mb-0 fw-medium">{profile.email}</p>
            </Col>
            <Col md={6}>
              <label className="form-label fw-semibold text-muted small">
                SO DIEN THOAI
              </label>
              <p className="mb-0 fw-medium">
                {profile.phone || "Chua cap nhat"}
              </p>
            </Col>
            <Col md={6}>
              <label className="form-label fw-semibold text-muted small">
                VAI TRO
              </label>
              <p className="mb-0">
                <span className={`badge text-bg-${roleInfo.bg}`}>
                  {roleInfo.label}
                </span>
              </p>
            </Col>
          </Row>
        )}
      </Card.Body>
    </Card>
  );
}
