import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Navbar,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import {
  changePasswordApi,
  getMyBookingsApi,
  getMeApi,
  updateProfileApi,
} from "../services/api";
import { saveAuth } from "../store/authSlice";

export function meta() {
  return [{ title: "Hồ sơ | Nexus Coffee" }];
}

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmt = (v) =>
  v ? new Date(v).toLocaleString("vi-VN") : "--";
const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString("vi-VN") : "--";
const fmtTime = (v) =>
  v
    ? new Date(v).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : "--";
const fmtMoney = (n) =>
  `${new Intl.NumberFormat("vi-VN").format(Number(n || 0))}đ`;

const ROLE_META = {
  Admin:    { label: "Quản trị viên", bg: "warning",  text: "dark",  icon: "bi-shield-fill",       avatarBg: "#f4a261" },
  Staff:    { label: "Nhân viên",     bg: "success",  text: "light", icon: "bi-person-badge-fill",  avatarBg: "#57cc99" },
  Customer: { label: "Khách hàng",   bg: "secondary", text: "light", icon: "bi-person-circle",      avatarBg: "#74c0fc" },
};

const STATUS_LABEL = {
  Pending: "Chờ xác nhận", Confirmed: "Đã xác nhận",
  Awaiting_Payment: "Chờ TT", In_Use: "Đang dùng",
  Completed: "Hoàn thành", Cancelled: "Đã hủy", Canceled: "Đã hủy",
};
const STATUS_VARIANT = {
  Pending: "secondary", Confirmed: "success", Awaiting_Payment: "warning",
  In_Use: "primary", Completed: "dark", Cancelled: "danger", Canceled: "danger",
};

// ─── Inline editable field (Customer) ────────────────────────────────────────
function EditableField({ label, field, value, type = "text", onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [saving, setSaving] = useState(false);

  const cancel = () => { setDraft(value || ""); setEditing(false); };

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSaving(true);
    await onSave(field, draft.trim());
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="mb-3">
      <div className="text-muted small text-uppercase">{label}</div>
      {editing ? (
        <form onSubmit={submit} className="d-flex align-items-center gap-2 mt-1">
          <input
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="form-control form-control-sm"
            autoFocus
          />
          <Button type="button" variant="outline-secondary" size="sm"
            className="rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 32, height: 32 }} onClick={cancel} disabled={saving}>
            <i className="bi bi-x-lg"></i>
          </Button>
          <Button type="submit" variant="success" size="sm"
            className="rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 32, height: 32 }} disabled={saving || !draft.trim()}>
            {saving ? <Spinner size="sm" animation="border" /> : <i className="bi bi-check-lg"></i>}
          </Button>
        </form>
      ) : (
        <div className="d-flex align-items-center justify-content-between gap-2 mt-1">
          <div className="fw-semibold">{value || <span className="text-muted fst-italic">Chưa cập nhật</span>}</div>
          <Button type="button" variant="outline-secondary" size="sm"
            className="rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 32, height: 32 }} onClick={() => { setDraft(value || ""); setEditing(true); }}>
            <i className="bi bi-pencil-square"></i>
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Admin / Staff profile ────────────────────────────────────────────────────
function StaffAdminProfile({ user, roleMeta, onLogout }) {
  const [profile, setProfile] = useState({ fullName: user.fullName || "", email: user.email || "", phone: user.phone || "" });
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [flash, setFlash] = useState(null);
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  const showFlash = (variant, message) => {
    setFlash({ variant, message });
    setTimeout(() => setFlash(null), 4000);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateProfileApi(profile);
      saveAuth(localStorage.getItem("token"), updated);
      setProfile({ fullName: updated.fullName, email: updated.email, phone: updated.phone || "" });
      showFlash("success", "Đã cập nhật thông tin tài khoản.");
    } catch (err) {
      showFlash("danger", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePwdChange = async (e) => {
    e.preventDefault();
    setChangingPwd(true);
    try {
      await changePasswordApi(pwd);
      setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showFlash("success", "Đổi mật khẩu thành công.");
    } catch (err) {
      showFlash("danger", err.message);
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Navbar */}
      <Navbar expand="lg" className="bg-dark shadow-sm sticky-top py-2" variant="dark">
        <Container fluid="xl">
          <Navbar.Brand as={Link} to="/" className="fw-bold text-white fs-5">
            <i className="bi bi-cup-hot-fill me-2 text-warning"></i>NEXUS COFFEE
          </Navbar.Brand>
          <div className="ms-auto d-flex align-items-center gap-3">
            <Badge bg={roleMeta.bg} text={roleMeta.text} className="px-3 py-2 rounded-pill fs-6">
              <i className={`bi ${roleMeta.icon} me-1`}></i>{roleMeta.label}
            </Badge>
            <Button variant="outline-light" size="sm" className="rounded-pill px-3" onClick={onLogout}>
              <i className="bi bi-box-arrow-right me-1"></i>Đăng xuất
            </Button>
          </div>
        </Container>
      </Navbar>

      <main className="flex-grow-1 py-4">
        <Container fluid="xl">
          <div className="mb-4">
            <h4 className="fw-bold mb-1">
              <i className="bi bi-person-gear me-2 text-warning"></i>Hồ sơ cá nhân
            </h4>
            <p className="text-muted mb-0">Quản lý thông tin cá nhân và mật khẩu đăng nhập.</p>
          </div>

          {flash && (
            <Alert variant={flash.variant} dismissible onClose={() => setFlash(null)}
              className="rounded-4 border-0 shadow-sm mb-4">
              <i className={`bi ${flash.variant === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"} me-2`}></i>
              {flash.message}
            </Alert>
          )}

          <Row className="g-4">
            {/* Thông tin cá nhân */}
            <Col lg={7}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Header className="bg-white border-bottom py-3 px-4">
                  <h5 className="fw-bold mb-0">
                    <i className="bi bi-person-fill me-2 text-primary"></i>Thông tin tài khoản
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center gap-4 mb-4">
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold fs-2 text-white"
                      style={{ width: 80, height: 80, backgroundColor: roleMeta.avatarBg }}>
                      {profile.fullName ? profile.fullName[0].toUpperCase() : "?"}
                    </div>
                    <div>
                      <h5 className="fw-bold mb-1">{profile.fullName}</h5>
                      <Badge bg={roleMeta.bg} text={roleMeta.text} className="px-3 py-1 rounded-pill">
                        {roleMeta.label}
                      </Badge>
                      <div className="text-muted small mt-1">
                        Tham gia: {fmt(user.createdAt)}
                      </div>
                    </div>
                  </div>

                  <Form onSubmit={handleProfileSave}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold small text-uppercase text-muted">Họ tên</Form.Label>
                          <Form.Control value={profile.fullName} required className="rounded-3"
                            onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))} />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold small text-uppercase text-muted">Số điện thoại</Form.Label>
                          <Form.Control value={profile.phone} className="rounded-3" placeholder="0901234567"
                            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold small text-uppercase text-muted">Email</Form.Label>
                      <Form.Control type="email" value={profile.email} required className="rounded-3"
                        onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
                    </Form.Group>
                    <Button type="submit" variant="dark" className="rounded-pill px-4" disabled={saving}>
                      {saving ? <><Spinner size="sm" animation="border" className="me-2" />Đang lưu...</> : <><i className="bi bi-floppy-fill me-2"></i>Lưu thay đổi</>}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            {/* Đổi mật khẩu + Đăng xuất */}
            <Col lg={5}>
              <Card className="border-0 shadow-sm rounded-4 mb-4">
                <Card.Header className="bg-white border-bottom py-3 px-4">
                  <h5 className="fw-bold mb-0">
                    <i className="bi bi-lock-fill me-2 text-danger"></i>Đổi mật khẩu
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <Form onSubmit={handlePwdChange}>
                    {["currentPassword", "newPassword", "confirmPassword"].map((field, i) => (
                      <Form.Group key={field} className="mb-3">
                        <Form.Label className="fw-semibold small text-uppercase text-muted">
                          {["Mật khẩu hiện tại", "Mật khẩu mới", "Xác nhận mật khẩu mới"][i]}
                        </Form.Label>
                        <Form.Control type="password" required className="rounded-3"
                          placeholder={i === 1 ? "Tối thiểu 6 ký tự" : "••••••••"}
                          value={pwd[field]}
                          onChange={(e) => setPwd((p) => ({ ...p, [field]: e.target.value }))} />
                      </Form.Group>
                    ))}
                    <Button type="submit" variant="danger" className="rounded-pill px-4 w-100 mt-1" disabled={changingPwd}>
                      {changingPwd ? <><Spinner size="sm" animation="border" className="me-2" />Đang xử lý...</> : <><i className="bi bi-key-fill me-2"></i>Đổi mật khẩu</>}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>

              <Card className="border-0 shadow-sm rounded-4">
                <Card.Body className="p-4">
                  <h6 className="fw-bold mb-3">
                    <i className="bi bi-door-open me-2 text-secondary"></i>Phiên đăng nhập
                  </h6>
                  <p className="text-muted small mb-3">Đăng xuất khỏi tài khoản. Bạn cần đăng nhập lại để tiếp tục.</p>
                  <Button variant="outline-secondary" className="rounded-pill px-4 w-100" onClick={onLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>Đăng xuất
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </main>
    </div>
  );
}

// ─── Customer profile ─────────────────────────────────────────────────────────
function CustomerProfile({ user, onLogout }) {
  const roleMeta = ROLE_META.Customer;
  const [profile, setProfile] = useState(user);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    getMyBookingsApi()
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setLoadingBookings(false));
  }, []);

  const showFlash = (variant, message) => {
    setFlash({ variant, message });
    setTimeout(() => setFlash(null), 4000);
  };

  const handleFieldSave = async (field, value) => {
    const fieldMap = { name: "fullName", email: "email", phone: "phone" };
    const payload = { fullName: profile.fullName, email: profile.email, phone: profile.phone || "", [fieldMap[field] || field]: value };
    try {
      const updated = await updateProfileApi(payload);
      saveAuth(localStorage.getItem("token"), updated);
      setProfile(updated);
      showFlash("success", "Đã cập nhật thông tin.");
    } catch (err) {
      showFlash("danger", err.message);
    }
  };

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === "Confirmed").length,
    active: bookings.filter((b) => b.status === "In_Use").length,
    deposit: fmtMoney(bookings.reduce((s, b) => s + (b.depositAmount || 0), 0)),
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-body-tertiary">
      <Navbar expand="lg" className="bg-dark shadow-sm sticky-top py-3" variant="dark">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold text-white fs-4">
            <i className="bi bi-cup-hot-fill me-2 text-warning"></i>NEXUS COFFEE
          </Navbar.Brand>
          <div className="ms-auto d-flex align-items-center gap-3">
            <Button variant="outline-light" className="px-4 rounded-pill fw-medium" onClick={onLogout}>
              Đăng xuất
            </Button>
          </div>
        </Container>
      </Navbar>

      <main className="flex-grow-1 py-5">
        <Container>
          {flash && (
            <Alert variant={flash.variant} dismissible onClose={() => setFlash(null)} className="border-0 shadow-sm rounded-4 mb-4">
              <i className={`bi ${flash.variant === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"} me-2`}></i>
              {flash.message}
            </Alert>
          )}

          {/* Hero + account card */}
          <Row className="g-4 mb-4">
            <Col lg={8}>
              <Card className="border-0 shadow-sm rounded-4 overflow-hidden h-100">
                <Card.Body className="p-4 p-lg-5 bg-dark text-light">
                  <Badge bg="warning" text="dark" className="mb-3 px-3 py-2 rounded-pill">KHÁCH HÀNG</Badge>
                  <h1 className="fw-bold mb-2">Xin chào, {profile.fullName}</h1>
                  <p className="text-secondary mb-4">Theo dõi booking và lịch sử của bạn tại Nexus Coffee.</p>
                  <Button as={Link} to="/spaces" variant="warning" className="rounded-pill px-4 fw-semibold">
                    Đặt chỗ mới
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-3">Thông tin tài khoản</h5>
                  <EditableField label="Tên khách hàng" field="name" value={profile.fullName} onSave={handleFieldSave} />
                  <EditableField label="Email" field="email" type="email" value={profile.email} onSave={handleFieldSave} />
                  <EditableField label="Số điện thoại" field="phone" type="tel" value={profile.phone} onSave={handleFieldSave} />
                  <div className="mb-3">
                    <div className="text-muted small text-uppercase">Vai trò</div>
                    <Badge bg={roleMeta.bg}>{roleMeta.label}</Badge>
                  </div>
                  <div className="mb-3">
                    <div className="text-muted small text-uppercase">Trạng thái</div>
                    <Badge bg={profile.membershipStatus === "Active" ? "success" : "secondary"}>
                      {profile.membershipStatus}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-muted small text-uppercase">Ngày tham gia</div>
                    <div className="fw-semibold">{fmt(profile.createdAt)}</div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Stats */}
          <Row className="g-4 mb-4">
            {[
              { icon: "bi-calendar-check-fill", title: "Tổng booking", value: stats.total, tone: "primary" },
              { icon: "bi-check-circle-fill",   title: "Đã xác nhận",  value: stats.confirmed, tone: "success" },
              { icon: "bi-lightning-charge-fill",title: "Đang dùng",   value: stats.active,   tone: "warning" },
              { icon: "bi-wallet2",             title: "Tổng đặt cọc", value: stats.deposit,  tone: "dark" },
            ].map(({ icon, title, value, tone }) => (
              <Col md={6} xl={3} key={title}>
                <Card className="border-0 shadow-sm rounded-4 h-100">
                  <Card.Body className="p-4 d-flex align-items-center">
                    <div className={`bg-${tone} bg-opacity-10 text-${tone} rounded-circle p-3 me-3 d-flex align-items-center justify-content-center`}
                      style={{ width: 60, height: 60 }}>
                      <i className={`bi ${icon} fs-3`}></i>
                    </div>
                    <div>
                      <h6 className="text-muted mb-1">{title}</h6>
                      <h3 className="fw-bold mb-0">{value}</h3>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Bookings table */}
          <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
            <Card.Header className="bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 text-dark">Booking của bạn</h5>
              <Badge bg="dark">{bookings.length}</Badge>
            </Card.Header>
            <Card.Body className="p-0">
              {loadingBookings ? (
                <div className="py-5 text-center text-muted">
                  <Spinner animation="border" size="sm" className="me-2" />Đang tải...
                </div>
              ) : (
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="py-3 px-4">Mã</th>
                      <th className="py-3 px-4">Không gian</th>
                      <th className="py-3 px-4">Thời gian</th>
                      <th className="py-3 px-4">Đặt cọc</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4">Tạo lúc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-5 px-4 text-center text-muted">
                          Bạn chưa có booking nào. Hãy{" "}
                          <Link to="/spaces" className="text-warning fw-semibold">đặt chỗ mới</Link> để bắt đầu.
                        </td>
                      </tr>
                    ) : (
                      bookings.map((b) => (
                        <tr key={b.id}>
                          <td className="py-3 px-4 fw-semibold text-primary">{b.bookingCode}</td>
                          <td className="py-3 px-4">{b.spaceName}</td>
                          <td className="py-3 px-4">
                            <div>{fmtDate(b.startTime)}</div>
                            <small className="text-muted">{fmtTime(b.startTime)} – {fmtTime(b.endTime)}</small>
                          </td>
                          <td className="py-3 px-4 fw-semibold">{fmtMoney(b.depositAmount)}</td>
                          <td className="py-3 px-4">
                            <Badge bg={STATUS_VARIANT[b.status] || "secondary"}>
                              {STATUS_LABEL[b.status] || b.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-muted small">{fmt(b.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Container>
      </main>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function Profile() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/"); };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark text-light">
        <div className="text-center">
          <i className="bi bi-lock-fill fs-1 text-warning mb-3 d-block"></i>
          <h5>Bạn chưa đăng nhập</h5>
          <Link to="/login" className="btn btn-warning rounded-pill px-4 mt-2">Đăng nhập ngay</Link>
        </div>
      </div>
    );
  }

  const roleMeta = ROLE_META[user.role] || ROLE_META.Customer;

  if (user.role === "Admin" || user.role === "Staff") {
    return <StaffAdminProfile user={user} roleMeta={roleMeta} onLogout={handleLogout} />;
  }

  return <CustomerProfile user={user} onLogout={handleLogout} />;
}
