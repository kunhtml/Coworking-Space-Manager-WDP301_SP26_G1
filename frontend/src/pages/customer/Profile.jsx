import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Navbar,
  Form,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import {
  getMeApi,
  updateProfileApi,
  changePasswordApi,
} from "../../services/api";

export function meta() {
  return [{ title: "Thông tin cá nhân | Nexus Coworking" }];
}

function formatDate(iso) {
  if (!iso) return "--";
  return new Date(iso).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const MEMBERSHIP_MAP = {
  Active: { label: "Đang hoạt động", bg: "success" },
  Inactive: { label: "Chưa kích hoạt", bg: "secondary" },
  Suspended: { label: "Tạm khóa", bg: "danger" },
};

export default function Profile() {
  const { user: authUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit profile state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null); // { type, text }

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    getMeApi()
      .then((data) => {
        setProfile(data);
        setFullName(data.fullName || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      const updated = await updateProfileApi({ fullName, email, phone });
      setProfile(updated);
      // Sync localStorage so navbar updates
      const stored = JSON.parse(localStorage.getItem("user") || "null");
      if (stored) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...stored,
            fullName: updated.fullName,
            email: updated.email,
            phone: updated.phone,
          }),
        );
      }
      setSaveMsg({ type: "success", text: "Cập nhật thông tin thành công." });
    } catch (err) {
      setSaveMsg({ type: "danger", text: err.message || "Cập nhật thất bại." });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangingPw(true);
    setPwMsg(null);
    try {
      const res = await changePasswordApi({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setPwMsg({
        type: "success",
        text: res.message || "Đổi mật khẩu thành công.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwMsg({
        type: "danger",
        text: err.message || "Đổi mật khẩu thất bại.",
      });
    } finally {
      setChangingPw(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const avatarLetter = (profile?.fullName || authUser?.fullName || "?")
    .charAt(0)
    .toUpperCase();
  const membership = MEMBERSHIP_MAP[profile?.membershipStatus] || {
    label: profile?.membershipStatus || "--",
    bg: "secondary",
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Navbar */}
      <Navbar expand="lg" className="bg-white shadow-sm sticky-top py-3">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold text-primary fs-4">
            <i className="bi bi-building me-2"></i>Nexus Coworking
          </Navbar.Brand>
          <Navbar.Toggle
            aria-controls="profile-nav"
            className="border-0 shadow-none"
          />
          <Navbar.Collapse id="profile-nav">
            <div className="ms-auto d-flex flex-column flex-lg-row gap-3 align-items-lg-center mt-3 mt-lg-0">
              <Link
                to="/dashboard"
                className="text-decoration-none text-dark fw-medium px-2 py-1"
              >
                Quản lý đặt chỗ
              </Link>
              <Link
                to="/profile"
                className="text-decoration-none text-dark fw-medium px-2 py-1"
              >
                Chỉnh sửa Profile
              </Link>
              <div className="d-flex gap-2 ms-lg-3 mt-2 mt-lg-0 align-items-center">
                <div
                  className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill border border-primary"
                  style={{ background: "#eef2ff" }}
                >
                  <div
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                    style={{
                      width: 30,
                      height: 30,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {avatarLetter}
                  </div>
                  <span
                    className="fw-medium text-primary"
                    style={{ fontSize: 14 }}
                  >
                    {profile?.fullName || authUser?.fullName || "Profile"}
                  </span>
                </div>
                <Button
                  variant="outline-danger"
                  className="px-4 rounded-pill fw-medium"
                  onClick={handleLogout}
                >
                  Đăng xuất
                </Button>
              </div>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="flex-grow-1 bg-light py-5">
        <Container>
          <Row className="mb-4 align-items-center">
            <Col>
              <h2 className="fw-bold mb-1 text-dark">Thông tin cá nhân</h2>
              <p className="text-muted mb-0">
                Xem và cập nhật thông tin tài khoản của bạn
              </p>
            </Col>
            <Col xs="auto">
              <Button
                as={Link}
                to="/dashboard"
                variant="outline-secondary"
                className="rounded-pill px-4 fw-medium"
              >
                <i className="bi bi-arrow-left me-1"></i> Quay lại
              </Button>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <Row className="g-4">
              {/* Left: Avatar card */}
              <Col lg={3} md={4}>
                <Card className="border-0 shadow-sm rounded-4 text-center p-4">
                  <div
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold mx-auto mb-3"
                    style={{ width: 90, height: 90, fontSize: 36 }}
                  >
                    {avatarLetter}
                  </div>
                  <h5 className="fw-bold mb-1">{profile?.fullName}</h5>
                  <p className="text-muted small mb-2">{profile?.email}</p>
                  <Badge
                    bg={membership.bg}
                    className="rounded-pill px-3 py-2 mb-3"
                  >
                    {membership.label}
                  </Badge>
                  <hr />
                  <div className="text-start small">
                    <div className="d-flex align-items-center gap-2 text-muted mb-2">
                      <i className="bi bi-shield-check text-primary"></i>
                      <span>
                        Vai trò:{" "}
                        <span className="fw-medium text-dark">
                          {profile?.role === "admin"
                            ? "Quản trị viên"
                            : "Khách hàng"}
                        </span>
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-2 text-muted">
                      <i className="bi bi-calendar3 text-primary"></i>
                      <span>
                        Tham gia:{" "}
                        <span className="fw-medium text-dark">
                          {formatDate(profile?.createdAt)}
                        </span>
                      </span>
                    </div>
                  </div>
                </Card>
              </Col>

              {/* Right: Edit forms */}
              <Col lg={9} md={8}>
                {/* Update profile */}
                <Card className="border-0 shadow-sm rounded-4 mb-4">
                  <Card.Header className="bg-white border-bottom py-3 px-4 rounded-top-4">
                    <h6 className="fw-bold mb-0">
                      <i className="bi bi-person-gear me-2 text-primary"></i>Cập
                      nhật thông tin
                    </h6>
                  </Card.Header>
                  <Card.Body className="p-4">
                    {saveMsg && (
                      <Alert
                        variant={saveMsg.type}
                        className="rounded-3 py-2 px-3 mb-4"
                        onClose={() => setSaveMsg(null)}
                        dismissible
                      >
                        <i
                          className={`bi ${saveMsg.type === "success" ? "bi-check-circle" : "bi-exclamation-circle"} me-2`}
                        ></i>
                        {saveMsg.text}
                      </Alert>
                    )}
                    <Form onSubmit={handleSaveProfile}>
                      <Row className="g-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold small text-muted text-uppercase">
                              Họ và tên
                            </Form.Label>
                            <Form.Control
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="rounded-3"
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold small text-muted text-uppercase">
                              Email
                            </Form.Label>
                            <Form.Control
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="rounded-3"
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold small text-muted text-uppercase">
                              Số điện thoại
                            </Form.Label>
                            <Form.Control
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="Nhập số điện thoại"
                              className="rounded-3"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <div className="mt-4 text-end">
                        <Button
                          type="submit"
                          variant="primary"
                          className="rounded-pill px-4 fw-medium"
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <Spinner size="sm" className="me-2" />
                              Đang lưu...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-check-lg me-1"></i>Lưu thay
                              đổi
                            </>
                          )}
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>

                {/* Change password */}
                <Card className="border-0 shadow-sm rounded-4">
                  <Card.Header className="bg-white border-bottom py-3 px-4 rounded-top-4">
                    <h6 className="fw-bold mb-0">
                      <i className="bi bi-lock me-2 text-warning"></i>Đổi mật
                      khẩu
                    </h6>
                  </Card.Header>
                  <Card.Body className="p-4">
                    {pwMsg && (
                      <Alert
                        variant={pwMsg.type}
                        className="rounded-3 py-2 px-3 mb-4"
                        onClose={() => setPwMsg(null)}
                        dismissible
                      >
                        <i
                          className={`bi ${pwMsg.type === "success" ? "bi-check-circle" : "bi-exclamation-circle"} me-2`}
                        ></i>
                        {pwMsg.text}
                      </Alert>
                    )}
                    <Form onSubmit={handleChangePassword}>
                      <Row className="g-3">
                        <Col md={12}>
                          <Form.Group>
                            <Form.Label className="fw-semibold small text-muted text-uppercase">
                              Mật khẩu hiện tại
                            </Form.Label>
                            <Form.Control
                              type="password"
                              value={currentPassword}
                              onChange={(e) =>
                                setCurrentPassword(e.target.value)
                              }
                              className="rounded-3"
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold small text-muted text-uppercase">
                              Mật khẩu mới
                            </Form.Label>
                            <Form.Control
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Tối thiểu 6 ký tự"
                              className="rounded-3"
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold small text-muted text-uppercase">
                              Xác nhận mật khẩu mới
                            </Form.Label>
                            <Form.Control
                              type="password"
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                              className="rounded-3"
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <div className="mt-4 text-end">
                        <Button
                          type="submit"
                          variant="warning"
                          className="rounded-pill px-4 fw-medium"
                          disabled={changingPw}
                        >
                          {changingPw ? (
                            <>
                              <Spinner size="sm" className="me-2" />
                              Đang đổi...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-shield-lock me-1"></i>Đổi mật
                              khẩu
                            </>
                          )}
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Container>
      </main>

      <footer className="bg-dark text-light py-4 mt-auto">
        <Container>
          <p className="text-secondary mb-0 text-center small">
            &copy; 2026 Nexus Coworking. All rights reserved.
          </p>
        </Container>
      </footer>
    </div>
  );
}
