import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Navbar, Form, Alert, Spinner, Badge } from "react-bootstrap";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import AuthNavActions from "../../components/common/AuthNavActions";
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
  const { user: authUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // States cho Form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    getMeApi()
      .then((data) => {
        setProfile(data);
        setFullName(data.fullName || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      const updated = await updateProfileApi({ fullName, email, phone });
      setProfile(updated);
      localStorage.setItem("user", JSON.stringify(updated)); // Đồng bộ Storage
      setSaveMsg({ type: "success", text: "Cập nhật hồ sơ thành công!" });
    } catch (err) {
      setSaveMsg({ type: "danger", text: err.message });
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return setPwMsg({ type: "danger", text: "Mật khẩu mới không khớp!" });
    setChangingPw(true);
    try {
      await changePasswordApi({ currentPassword, newPassword, confirmPassword });
      setPwMsg({ type: "success", text: "Đã đổi mật khẩu thành công." });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      setPwMsg({
        type: "danger",
        text: err.message || "Đổi mật khẩu thất bại.",
      });
    } finally {
      setChangingPw(false);
    }
  };

  const avatarLetter = (profile?.fullName || authUser?.fullName || "?")
    .charAt(0)
    .toUpperCase();
  const membership = MEMBERSHIP_MAP[profile?.membershipStatus] || {
    label: profile?.membershipStatus || "--",
    bg: "secondary",
  };

  return (
    <div
      className="d-flex flex-column min-vh-100 bg-dark text-light font-monospace"
      style={{ overflowX: "hidden" }}
    >
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
                className="text-decoration-none text-light fw-medium px-2 py-1 hover-primary transition-all text-uppercase"
              >
                Không gian
              </Link>
              <Link
                to="/menu"
                className="text-decoration-none text-light fw-medium px-2 py-1 hover-primary transition-all text-uppercase"
              >
                Thực đơn
              </Link>
              <Link
                to="/profile"
                className="text-decoration-none text-warning fw-bold px-2 py-1 text-uppercase"
              >
                Hồ sơ
              </Link>
              <AuthNavActions
                displayName={
                  profile?.fullName ||
                  authUser?.fullName ||
                  authUser?.email ||
                  "Profile"
                }
              />
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="flex-grow-1 py-5">
        <Container>
          <h2 className="text-uppercase fw-bold mb-4 border-start border-4 ps-3" style={{ borderColor: "#d4a373" }}>
            Hồ sơ cá nhân
          </h2>

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" style={{ color: "#d4a373" }} /></div>
          ) : (
            <Row className="g-4">
              {/* Cột trái: Thông tin tổng quan */}
              <Col lg={4}>
                <Card className="bg-dark border-secondary rounded-0 shadow text-center p-4">
                  <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                    style={{ width: 100, height: 100, fontSize: 40, backgroundColor: "#d4a373", color: "#000" }}>
                    {avatarLetter}
                  </div>
                  <h4 className="fw-bold text-uppercase">{profile?.fullName}</h4>
                  <p className="text-secondary small">{profile?.email}</p>
                  <Badge bg="outline-secondary" className="border border-secondary rounded-0 px-3 py-2 text-uppercase">
                    Trạng thái: {profile?.membershipStatus || 'Thành viên'}
                  </Badge>
                </Card>
              </Col>

              {/* Cột phải: Các Form chỉnh sửa */}
              <Col lg={8}>
                {/* Form Thông tin */}
                <Card className="bg-dark border-secondary rounded-0 mb-4">
                  <Card.Header className="bg-secondary bg-opacity-10 border-bottom border-secondary text-uppercase fw-bold py-3">
                    <i className="bi bi-person-badge me-2" style={{ color: "#d4a373" }}></i>
                    <h5 className="text-white text-uppercase fw-bold mb-0">Chỉnh sửa thông tin</h5>
                  </Card.Header>
                  <Card.Body>
                    {saveMsg && <Alert variant={saveMsg.type} className="rounded-0 small">{saveMsg.text}</Alert>}
                    <Form onSubmit={handleSaveProfile}>
                      <Row>
                        <Col md={6} className="mb-3">
                          <Form.Label className="small text-secondary text-uppercase">Họ và tên</Form.Label>
                          <Form.Control className="bg-dark text-light border-secondary rounded-0"
                            value={fullName} onChange={e => setFullName(e.target.value)} />
                        </Col>
                        <Col md={6} className="mb-3">
                          <Form.Label className="small text-secondary text-uppercase">Số điện thoại</Form.Label>
                          <Form.Control className="bg-dark text-light border-secondary rounded-0"
                            value={phone} onChange={e => setPhone(e.target.value)} />
                        </Col>
                        <Col md={12} className="mb-3">
                          <Form.Label className="small text-secondary text-uppercase">Email</Form.Label>
                          <Form.Control className="bg-dark text-light border-secondary rounded-0"
                            value={email} onChange={e => setEmail(e.target.value)} />
                        </Col>
                      </Row>
                      <Button type="submit" disabled={saving} className="rounded-0 border-0 px-4 text-dark fw-bold text-uppercase"
                        style={{ backgroundColor: "#d4a373" }}>
                        {saving ? "Đang lưu..." : "Cập nhật thông tin"}
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>

                {/* Form Mật khẩu */}
                <Card className="bg-dark border-secondary rounded-0">
                  <Card.Header className="bg-secondary bg-opacity-10 border-bottom border-secondary text-uppercase fw-bold py-3">
                    <i className="bi bi-shield-lock me-2" style={{ color: "#d4a373" }}></i>
                    <h5 className="text-white text-uppercase fw-bold mb-0">Bảo mật tài khoản</h5>
                  </Card.Header>
                  <Card.Body>
                    {pwMsg && <Alert variant={pwMsg.type} className="rounded-0 small">{pwMsg.text}</Alert>}
                    <Form onSubmit={handleChangePassword}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small text-secondary text-uppercase">Mật khẩu hiện tại</Form.Label>
                        <Form.Control type="password" required className="bg-dark text-light border-secondary rounded-0"
                          value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                      </Form.Group>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="small text-secondary text-uppercase">Mật khẩu mới</Form.Label>
                            <Form.Control type="password" required className="bg-dark text-light border-secondary rounded-0"
                              value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="small text-secondary text-uppercase">Xác nhận mật khẩu mới</Form.Label>
                            <Form.Control type="password" required className="bg-dark text-light border-secondary rounded-0"
                              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Button type="submit" disabled={changingPw} variant="outline-danger" className="rounded-0 px-4 text-uppercase">
                        {changingPw ? "Đang xử lý..." : "Đổi mật khẩu"}
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Container>
      </main>
    </div>
  );
}