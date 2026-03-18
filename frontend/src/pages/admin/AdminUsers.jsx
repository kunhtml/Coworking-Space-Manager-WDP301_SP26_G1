<<<<<<< HEAD
import { useState, useEffect } from "react";
=======
import { useState, useEffect, useCallback } from "react";
>>>>>>> ThanhDH
import {
  Badge,
  Button,
  Card,
  Col,
<<<<<<< HEAD
  Container,
  Form,
  Modal,
  Nav,
  Navbar,
=======
  Form,
  InputGroup,
  Modal,
>>>>>>> ThanhDH
  Row,
  Table,
  Alert,
  Spinner,
<<<<<<< HEAD
  Dropdown,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { apiClient as api } from "../../services/api";

export function meta() {
  return [
    { title: "Quản lý User | Nexus Admin" },
=======
} from "react-bootstrap";
import { apiClient as api } from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";

export function meta() {
  return [
    { title: "Quản lý Tài khoản | Nexus Admin" },
>>>>>>> ThanhDH
    { name: "description", content: "Quản lý người dùng Nexus Coworking" },
  ];
}

<<<<<<< HEAD
export default function AdminUsers() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
=======
// ─── Constants ────────────────────────────────────────────────────────────────
const ROLE_MAP = {
  Admin: { label: "Quản trị viên", bg: "danger" },
  Staff: { label: "Nhân viên", bg: "primary" },
  Customer: { label: "Khách hàng", bg: "secondary" },
};

// Chỉ 2 trạng thái: Hoạt động và Tạm khóa
const STATUS_MAP = {
  Active: { label: "Hoạt động", bg: "success" },
  Suspended: { label: "Tạm khóa", bg: "danger" },
};

const EMPTY_FORM = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  role: "Customer",
  membershipStatus: "Active",
};

// ─── Validation ───────────────────────────────────────────────────────────────
const validateAddForm = (form) => {
  const errors = {};

  if (!form.fullName.trim()) {
    errors.fullName = "Họ và tên không được để trống.";
  }

  if (!form.email.trim()) {
    errors.email = "Email không được để trống.";
  } else if (!/^[^\s@]+@gmail\.com$/i.test(form.email.trim())) {
    errors.email = "Email phải có dạng ...@gmail.com.";
  }

  if (!form.password) {
    errors.password = "Mật khẩu không được để trống.";
  } else if (form.password.length < 6) {
    errors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "Mật khẩu xác nhận không khớp.";
  }

  if (form.phone && form.phone.trim()) {
    if (!/^\d{10,}$/.test(form.phone.trim())) {
      errors.phone = "Số điện thoại phải có ít nhất 10 chữ số.";
    }
  }

  return errors; // {} nếu hợp lệ
};

const validateEditForm = (form) => {
  const errors = {};

  if (!form.fullName.trim()) {
    errors.fullName = "Họ và tên không được để trống.";
  }

  if (!form.email.trim()) {
    errors.email = "Email không được để trống.";
  } else if (!/^[^\s@]+@gmail\.com$/i.test(form.email.trim())) {
    errors.email = "Email phải có dạng ...@gmail.com.";
  }

  if (form.phone && form.phone.trim()) {
    if (!/^\d{10,}$/.test(form.phone.trim())) {
      errors.phone = "Số điện thoại phải có ít nhất 10 chữ số.";
    }
  }

  return errors;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminUsers() {
  // ─── Data state ─────────────────────────────────
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
>>>>>>> ThanhDH
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

<<<<<<< HEAD
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    role: "Customer",
    membershipStatus: "Active",
  });
  const [editingId, setEditingId] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get("/users");
=======
  // ─── Filter state ────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("Tất cả");
  const [filterStatus, setFilterStatus] = useState("Tất cả");

  // ─── Modals ──────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);   // Khóa tài khoản
  const [showUnlockModal, setShowUnlockModal] = useState(false); // Mở khóa

  // ─── Form ────────────────────────────────────────
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [targetUser, setTargetUser] = useState(null); // dùng cho lock/unlock

  // ─── Load users ──────────────────────────────────
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (filterRole !== "Tất cả") params.set("role", filterRole);
      if (filterStatus !== "Tất cả") params.set("status", filterStatus);
      const qs = params.toString();
      const data = await api.get(`/users${qs ? `?${qs}` : ""}`);
>>>>>>> ThanhDH
      setUsers(data);
    } catch (err) {
      setError(err.message || "Lỗi khi tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
<<<<<<< HEAD
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      password: "",
      phone: "",
      role: "Customer",
      membershipStatus: "Active",
    });
    setEditingId(null);
  };

  // === ADD ===
  const openAdd = () => {
    resetForm();
    setShowAddModal(true);
=======
  }, [search, filterRole, filterStatus]);

  useEffect(() => {
    const timer = setTimeout(loadUsers, 300);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  // Thống kê tổng (không bị ảnh hưởng bởi filter)
  const loadAllUsers = useCallback(async () => {
    try {
      const data = await api.get("/users");
      setAllUsers(data);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    loadAllUsers();
  }, [loadAllUsers, success]);

  const stats = {
    total: allUsers.length,
    admin: allUsers.filter((u) => (u.role || "").toLowerCase() === "admin").length,
    staff: allUsers.filter((u) => (u.role || "").toLowerCase() === "staff").length,
    customer: allUsers.filter((u) => (u.role || "").toLowerCase() === "customer").length,
    suspended: allUsers.filter(
      (u) => (u.membershipStatus || "").toLowerCase() === "suspended"
    ).length,
  };

  // ─── Helpers ─────────────────────────────────────
  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setFieldErrors({});
    setEditingId(null);
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

  const field = (name, value) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  // Xóa lỗi của field khi user gõ lại
  const clearFieldError = (name) =>
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });

  // ─── ADD ─────────────────────────────────────────
  const openAdd = () => {
    resetForm();
    setShowAddModal(true);
    setError("");
>>>>>>> ThanhDH
  };

  const submitAdd = async (e) => {
    e.preventDefault();
    setError("");
<<<<<<< HEAD
    setSuccess("");
    try {
      const res = await api.post("/users", formData);
      setSuccess(res.message || "Thêm người dùng thành công!");
=======

    // Client-side validation
    const errors = validateAddForm(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFormLoading(true);
    try {
      const res = await api.post("/users", {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        role: formData.role,
        membershipStatus: formData.membershipStatus,
      });
      showSuccess(res.message || "Thêm tài khoản thành công!");
>>>>>>> ThanhDH
      setShowAddModal(false);
      resetForm();
      loadUsers();
    } catch (err) {
<<<<<<< HEAD
      setError(err.message || "Lỗi khi thêm người dùng");
    }
  };

  // === EDIT ===
  const openEdit = (userItem) => {
    setEditingId(userItem._id);
    setFormData({
      fullName: userItem.fullName || "",
      email: userItem.email || "",
      password: "", // Don't prefill password
      phone: userItem.phone || "",
      role: userItem.role || "Customer",
      membershipStatus: userItem.membershipStatus || "Active",
    });
=======
      // BE sẽ báo nếu email đã tồn tại
      if (err.message?.includes("Email")) {
        setFieldErrors({ email: err.message });
      } else {
        setError(err.message || "Lỗi khi thêm tài khoản");
      }
    } finally {
      setFormLoading(false);
    }
  };

  // ─── EDIT ────────────────────────────────────────
  const openEdit = (u) => {
    setEditingId(u._id);
    setFormData({
      fullName: u.fullName || "",
      email: u.email || "",
      password: "",
      confirmPassword: "",
      phone: u.phone || "",
      role: u.role || "Customer",
      membershipStatus: u.membershipStatus || "Active",
    });
    setFieldErrors({});
    setError("");
>>>>>>> ThanhDH
    setShowEditModal(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setError("");
<<<<<<< HEAD
    setSuccess("");
    try {
      // Don't send password in update (backend doesn't handle it)
      const { password, ...updateData } = formData;
      const res = await api.put(`/users/${editingId}`, updateData);
      setSuccess(res.message || "Cập nhật người dùng thành công!");
=======

    const errors = validateEditForm(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFormLoading(true);
    try {
      const res = await api.put(`/users/${editingId}`, {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        role: formData.role,
        membershipStatus: formData.membershipStatus,
      });
      showSuccess(res.message || "Cập nhật tài khoản thành công!");
>>>>>>> ThanhDH
      setShowEditModal(false);
      resetForm();
      loadUsers();
    } catch (err) {
<<<<<<< HEAD
      setError(err.message || "Lỗi khi cập nhật người dùng");
    }
  };

  // === DELETE ===
  const openDelete = (userItem) => {
    setDeletingUser(userItem);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    setError("");
    setSuccess("");
    try {
      const res = await api.delete(`/users/${deletingUser._id}`);
      setSuccess(res.message || "Xóa người dùng thành công!");
      setShowDeleteModal(false);
      setDeletingUser(null);
      loadUsers();
    } catch (err) {
      setError(err.message || "Lỗi khi xóa người dùng");
      setShowDeleteModal(false);
    }
  };

  const ROLE_MAP = {
    Admin: { label: "Quản trị viên", bg: "danger" },
    Staff: { label: "Nhân viên", bg: "primary" },
    Customer: { label: "Khách hàng", bg: "secondary" },
  };

  const STATUS_MAP = {
    Active: { label: "Hoạt động", bg: "success" },
    Inactive: { label: "Chưa kích hoạt", bg: "warning" },
    Suspended: { label: "Tạm khóa", bg: "danger" },
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold text-white">
            <i className="bi bi-cup-hot-fill me-2 text-warning"></i>
            NEXUS ADMIN
          </Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse>
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/admin" className="text-light">
                <i className="bi bi-list-ul me-1"></i>
                Quản lý Menu
              </Nav.Link>
              <Nav.Link as={Link} to="/admin/tables" className="text-light">
                <i className="bi bi-table me-1"></i>
                Quản lý Bàn
              </Nav.Link>
              <Nav.Link as={Link} to="/admin/users" className="text-light">
                <i className="bi bi-people me-1"></i>
                Quản lý User
              </Nav.Link>
              <Nav.Link as={Link} to="/admin/reports" className="text-light">
                <i className="bi bi-bar-chart-line me-1"></i>
                Report & Analytics
              </Nav.Link>
            </Nav>
            <div className="ms-auto d-flex align-items-center gap-3 mt-3 mt-lg-0">
              <Dropdown align="end">
                <Dropdown.Toggle
                  variant="outline-light"
                  size="sm"
                  className="d-flex align-items-center gap-2"
                >
                  <i className="bi bi-person-circle"></i>
                  <span>{user?.fullName || user?.email || "Admin"}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu className="shadow">
                  <Dropdown.Item as={Link} to="/admin/profile">
                    <i className="bi bi-person me-2"></i>
                    Hồ sơ
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout} className="text-danger">
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Đăng xuất
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main */}
      <Container className="py-5">
        <Row className="mb-4 align-items-center">
          <Col>
            <h2 className="fw-bold mb-1">
              <i className="bi bi-people me-2 text-primary"></i>
              Quản lý User
            </h2>
            <p className="text-muted mb-0">
              Danh sách người dùng trong hệ thống
            </p>
          </Col>
          <Col xs="auto">
            <Button
              variant="success"
              size="lg"
              className="rounded-pill shadow-sm"
              onClick={openAdd}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Thêm User mới
            </Button>
          </Col>
        </Row>

        {/* Alerts */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess("")}>
            {success}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Row className="mb-4 g-3">
          <Col md={3}>
=======
      if (err.message?.includes("Email")) {
        setFieldErrors({ email: err.message });
      } else {
        setError(err.message || "Lỗi khi cập nhật tài khoản");
      }
    } finally {
      setFormLoading(false);
    }
  };

  // ─── LOCK (Tạm khóa) ─────────────────────────────
  const openLock = (u) => {
    setTargetUser(u);
    setShowLockModal(true);
  };

  const confirmLock = async () => {
    if (!targetUser) return;
    setFormLoading(true);
    try {
      const res = await api.put(`/users/${targetUser._id}`, {
        fullName: targetUser.fullName,
        email: targetUser.email,
        phone: targetUser.phone || "",
        role: targetUser.role,
        membershipStatus: "Suspended",
      });
      showSuccess(res.message || `Đã khóa tài khoản ${targetUser.fullName || targetUser.email}.`);
      setShowLockModal(false);
      setTargetUser(null);
      loadUsers();
    } catch (err) {
      setError(err.message || "Lỗi khi khóa tài khoản");
      setShowLockModal(false);
    } finally {
      setFormLoading(false);
    }
  };

  // ─── UNLOCK (Mở khóa) ────────────────────────────
  const openUnlock = (u) => {
    setTargetUser(u);
    setShowUnlockModal(true);
  };

  const confirmUnlock = async () => {
    if (!targetUser) return;
    setFormLoading(true);
    try {
      const res = await api.put(`/users/${targetUser._id}`, {
        fullName: targetUser.fullName,
        email: targetUser.email,
        phone: targetUser.phone || "",
        role: targetUser.role,
        membershipStatus: "Active",
      });
      showSuccess(res.message || `Đã mở khóa tài khoản ${targetUser.fullName || targetUser.email}.`);
      setShowUnlockModal(false);
      setTargetUser(null);
      loadUsers();
    } catch (err) {
      setError(err.message || "Lỗi khi mở khóa tài khoản");
      setShowUnlockModal(false);
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Form field component (tái sử dụng) ──────────
  const FieldGroup = ({ label, required, error, children }) => (
    <Form.Group>
      <Form.Label className="fw-semibold">
        {label} {required && <span className="text-danger">*</span>}
      </Form.Label>
      {children}
      {error && (
        <Form.Text className="text-danger">
          <i className="bi bi-exclamation-circle me-1"></i>
          {error}
        </Form.Text>
      )}
    </Form.Group>
  );

  // ─── Render ──────────────────────────────────────
  return (
    <AdminLayout>
      {/* Header */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-people-fill me-2 text-primary"></i>
            Quản lý Tài khoản
          </h2>
          <p className="text-muted mb-0">
            Quản lý toàn bộ người dùng trong hệ thống
          </p>
        </Col>
        <Col xs="auto">
          <Button
            variant="success"
            size="lg"
            className="rounded-pill shadow-sm"
            onClick={openAdd}
          >
            <i className="bi bi-person-plus-fill me-2"></i>
            Thêm tài khoản
          </Button>
        </Col>
      </Row>

      {/* Alerts */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess("")}>
          <i className="bi bi-check-circle-fill me-2"></i>
          {success}
        </Alert>
      )}

      {/* Stat Cards */}
      <Row className="mb-4 g-3">
        {[
          { label: "Tổng tài khoản", value: stats.total, icon: "bi-people", color: "primary" },
          { label: "Quản trị viên", value: stats.admin, icon: "bi-shield-fill", color: "danger" },
          { label: "Nhân viên", value: stats.staff, icon: "bi-person-badge", color: "info" },
          { label: "Khách hàng", value: stats.customer, icon: "bi-person-check", color: "success" },
          { label: "Đang bị khóa", value: stats.suspended, icon: "bi-lock-fill", color: "warning" },
        ].map((s, i) => (
          <Col md={i < 4 ? 3 : 12} lg="auto" key={i} style={{ minWidth: 160 }}>
>>>>>>> ThanhDH
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
<<<<<<< HEAD
                    <p className="text-muted small mb-1">Tổng Users</p>
                    <h3 className="fw-bold mb-0">{users.length}</h3>
                  </div>
                  <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-people fs-4 text-primary"></i>
=======
                    <p className="text-muted small mb-1">{s.label}</p>
                    <h3 className="fw-bold mb-0">{s.value}</h3>
                  </div>
                  <div className={`bg-${s.color} bg-opacity-10 rounded-circle p-3`}>
                    <i className={`bi ${s.icon} fs-4 text-${s.color}`}></i>
>>>>>>> ThanhDH
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
<<<<<<< HEAD
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted small mb-1">Admin</p>
                    <h3 className="fw-bold mb-0">
                      {users.filter((u) => u.role === "Admin").length}
                    </h3>
                  </div>
                  <div className="bg-danger bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-shield-fill fs-4 text-danger"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted small mb-1">Staff</p>
                    <h3 className="fw-bold mb-0">
                      {users.filter((u) => u.role === "Staff").length}
                    </h3>
                  </div>
                  <div className="bg-info bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-person-badge fs-4 text-info"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted small mb-1">Customers</p>
                    <h3 className="fw-bold mb-0">
                      {users.filter((u) => u.role === "Customer").length}
                    </h3>
                  </div>
                  <div className="bg-success bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-person-check fs-4 text-success"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Users Table */}
        <Card className="shadow-sm border-0 rounded-3">
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="text-muted mt-3 mb-0">Đang tải...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-5">
                <i
                  className="bi bi-inbox text-muted"
                  style={{ fontSize: "3rem" }}
                ></i>
                <p className="text-muted mt-3 mb-2">Chưa có người dùng nào.</p>
                <Button variant="primary" onClick={openAdd}>
                  Thêm người dùng đầu tiên
                </Button>
              </div>
            ) : (
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-4 py-3">Họ và tên</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Số điện thoại</th>
                    <th className="px-4 py-3">Vai trò</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Ngày tạo</th>
                    <th className="px-4 py-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userItem) => {
                    const roleInfo = ROLE_MAP[userItem.role] || {
                      label: userItem.role,
                      bg: "secondary",
                    };
                    const statusInfo = STATUS_MAP[
                      userItem.membershipStatus
                    ] || {
                      label: userItem.membershipStatus,
                      bg: "secondary",
                    };

                    return (
                      <tr key={userItem._id}>
                        <td className="px-4 py-3 fw-medium">
                          {userItem.fullName || "-"}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {userItem.email}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {userItem.phone || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge bg={roleInfo.bg} className="px-2 py-1">
                            {roleInfo.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge bg={statusInfo.bg} className="px-2 py-1">
                            {statusInfo.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {new Date(userItem.createdAt).toLocaleDateString(
                            "vi-VN",
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="d-flex gap-2 justify-content-center">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => openEdit(userItem)}
                            >
                              <i className="bi bi-pencil"></i>
                              Sửa
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* ADD MODAL */}
      <Modal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
=======
        ))}
      </Row>

      {/* Search & Filter */}
      <Card className="shadow-sm border-0 rounded-3 mb-4">
        <Card.Body className="p-3">
          <Row className="g-2 align-items-center">
            <Col md={5}>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Tìm theo tên, email, số điện thoại..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-start-0 ps-0"
                />
                {search && (
                  <Button variant="outline-secondary" onClick={() => setSearch("")}>
                    <i className="bi bi-x"></i>
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="Tất cả">Tất cả vai trò</option>
                <option value="Admin">Quản trị viên</option>
                <option value="Staff">Nhân viên</option>
                <option value="Customer">Khách hàng</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="Tất cả">Tất cả trạng thái</option>
                <option value="Active">Hoạt động</option>
                <option value="Suspended">Tạm khóa</option>
              </Form.Select>
            </Col>
            <Col md={1} className="text-end">
              <Button
                variant="outline-secondary"
                onClick={() => { setSearch(""); setFilterRole("Tất cả"); setFilterStatus("Tất cả"); }}
                title="Xóa bộ lọc"
              >
                <i className="bi bi-arrow-counterclockwise"></i>
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Table */}
      <Card className="shadow-sm border-0 rounded-3">
        <Card.Header className="bg-white border-0 py-3 px-4 d-flex justify-content-between align-items-center">
          <span className="fw-semibold text-secondary">
            {loading ? (
              <Spinner size="sm" animation="border" className="me-2" />
            ) : (
              <i className="bi bi-list-ul me-2"></i>
            )}
            {users.length} kết quả
          </span>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-3 mb-0">Đang tải...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox text-muted" style={{ fontSize: "3rem" }}></i>
              <p className="text-muted mt-3 mb-2">
                {search || filterRole !== "Tất cả" || filterStatus !== "Tất cả"
                  ? "Không tìm thấy tài khoản phù hợp."
                  : "Chưa có tài khoản nào."}
              </p>
              <Button variant="primary" onClick={openAdd}>
                Thêm tài khoản đầu tiên
              </Button>
            </div>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Họ và tên</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Số điện thoại</th>
                  <th className="px-4 py-3">Vai trò</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Ngày tạo</th>
                  <th className="px-4 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => {
                  const roleInfo = ROLE_MAP[u.role] || { label: u.role, bg: "secondary" };
                  // Normalize status key
                  const statusKey =
                    (u.membershipStatus || "").toLowerCase() === "suspended"
                      ? "Suspended"
                      : "Active";
                  const statusInfo = STATUS_MAP[statusKey];
                  const isSuspended = statusKey === "Suspended";

                  return (
                    <tr key={u._id} className={isSuspended ? "table-warning" : ""}>
                      <td className="px-4 py-3 text-muted small">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                            style={{
                              width: 36, height: 36,
                              backgroundColor: isSuspended ? "#ffc10720" : "#e9ecef",
                              fontSize: 13, color: isSuspended ? "#856404" : "#495057",
                              border: isSuspended ? "1px solid #ffc107" : "none",
                            }}
                          >
                            {(u.fullName || u.email || "?").split(" ").slice(-1)[0]?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <div className="fw-medium">{u.fullName || "—"}</div>
                            {isSuspended && (
                              <small className="text-warning">
                                <i className="bi bi-lock-fill me-1"></i>Đang bị khóa
                              </small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{u.email}</td>
                      <td className="px-4 py-3 text-muted">{u.phone || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge bg={roleInfo.bg} className="px-2 py-1">
                          {roleInfo.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge bg={statusInfo.bg} className="px-2 py-1">
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted small">
                        {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="d-flex gap-2 justify-content-center flex-wrap">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => openEdit(u)}
                            title="Chỉnh sửa"
                          >
                            <i className="bi bi-pencil me-1"></i>
                            Sửa
                          </Button>
                          {isSuspended ? (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => openUnlock(u)}
                              title="Mở khóa tài khoản"
                            >
                              <i className="bi bi-unlock me-1"></i>
                              Mở khóa
                            </Button>
                          ) : (
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => openLock(u)}
                              title="Tạm khóa tài khoản"
                            >
                              <i className="bi bi-lock me-1"></i>
                              Khoá
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* ══════════════════════════════════════════════
          ADD MODAL
      ══════════════════════════════════════════════ */}
      <Modal
        show={showAddModal}
        onHide={() => { setShowAddModal(false); resetForm(); setError(""); }}
>>>>>>> ThanhDH
        size="lg"
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
<<<<<<< HEAD
            <i className="bi bi-person-plus me-2 text-success"></i>
            Thêm User mới
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={submitAdd}>
          <Modal.Body className="px-4">
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Họ và tên <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nhập họ và tên"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Email <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Nhập email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Mật khẩu <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Nhập mật khẩu"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Số điện thoại</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="Nhập số điện thoại"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Vai trò</Form.Label>
                  <Form.Select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
=======
            <i className="bi bi-person-plus-fill me-2 text-success"></i>
            Thêm tài khoản mới
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={submitAdd} noValidate>
          <Modal.Body className="px-4">
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError("")} className="py-2">
                {error}
              </Alert>
            )}
            <Row className="g-3">
              {/* Họ tên */}
              <Col md={6}>
                <FieldGroup label="Họ và tên" required error={fieldErrors.fullName}>
                  <Form.Control
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    isInvalid={!!fieldErrors.fullName}
                    onChange={(e) => { field("fullName", e.target.value); clearFieldError("fullName"); }}
                  />
                </FieldGroup>
              </Col>

              {/* Email */}
              <Col md={6}>
                <FieldGroup label="Email" required error={fieldErrors.email}>
                  <Form.Control
                    type="email"
                    placeholder="example@gmail.com"
                    value={formData.email}
                    isInvalid={!!fieldErrors.email}
                    onChange={(e) => { field("email", e.target.value); clearFieldError("email"); }}
                  />

                </FieldGroup>
              </Col>

              {/* Mật khẩu */}
              <Col md={6}>
                <FieldGroup label="Mật khẩu" required error={fieldErrors.password}>
                  <Form.Control
                    type="password"
                    placeholder="Tối thiểu 6 ký tự"
                    value={formData.password}
                    isInvalid={!!fieldErrors.password}
                    onChange={(e) => { field("password", e.target.value); clearFieldError("password"); }}
                    autoComplete="new-password"
                  />
                </FieldGroup>
              </Col>

              {/* Xác nhận mật khẩu */}
              <Col md={6}>
                <FieldGroup label="Xác nhận mật khẩu" required error={fieldErrors.confirmPassword}>
                  <Form.Control
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    value={formData.confirmPassword}
                    isInvalid={!!fieldErrors.confirmPassword}
                    onChange={(e) => { field("confirmPassword", e.target.value); clearFieldError("confirmPassword"); }}
                    autoComplete="new-password"
                  />
                </FieldGroup>
              </Col>

              {/* Số điện thoại */}
              <Col md={6}>
                <FieldGroup label="Số điện thoại" error={fieldErrors.phone}>
                  <Form.Control
                    type="tel"
                    placeholder="Tối thiểu 10 số"
                    value={formData.phone}
                    isInvalid={!!fieldErrors.phone}
                    onChange={(e) => { field("phone", e.target.value); clearFieldError("phone"); }}
                  />
                </FieldGroup>
              </Col>

              {/* Vai trò */}
              <Col md={3}>
                <FieldGroup label="Vai trò">
                  <Form.Select
                    value={formData.role}
                    onChange={(e) => field("role", e.target.value)}
>>>>>>> ThanhDH
                  >
                    <option value="Customer">Khách hàng</option>
                    <option value="Staff">Nhân viên</option>
                    <option value="Admin">Quản trị viên</option>
                  </Form.Select>
<<<<<<< HEAD
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Trạng thái</Form.Label>
                  <Form.Select
                    value={formData.membershipStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        membershipStatus: e.target.value,
                      })
                    }
                  >
                    <option value="Active">Hoạt động</option>
                    <option value="Inactive">Chưa kích hoạt</option>
                    <option value="Suspended">Tạm khóa</option>
                  </Form.Select>
                </Form.Group>
=======
                </FieldGroup>
              </Col>

              {/* Trạng thái */}
              <Col md={3}>
                <FieldGroup label="Trạng thái">
                  <Form.Select
                    value={formData.membershipStatus}
                    onChange={(e) => field("membershipStatus", e.target.value)}
                  >
                    <option value="Active">Hoạt động</option>
                    <option value="Suspended">Tạm khóa</option>
                  </Form.Select>
                </FieldGroup>
>>>>>>> ThanhDH
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button
              variant="outline-secondary"
<<<<<<< HEAD
              onClick={() => setShowAddModal(false)}
            >
              Hủy
            </Button>
            <Button variant="success" type="submit">
              <i className="bi bi-check-lg me-1"></i>
              Thêm User
=======
              onClick={() => { setShowAddModal(false); resetForm(); setError(""); }}
              disabled={formLoading}
            >
              Hủy
            </Button>
            <Button variant="success" type="submit" disabled={formLoading}>
              {formLoading ? (
                <Spinner size="sm" animation="border" className="me-1" />
              ) : (
                <i className="bi bi-check-lg me-1"></i>
              )}
              Thêm tài khoản
>>>>>>> ThanhDH
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

<<<<<<< HEAD
      {/* EDIT MODAL */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
=======
      {/* ══════════════════════════════════════════════
          EDIT MODAL
      ══════════════════════════════════════════════ */}
      <Modal
        show={showEditModal}
        onHide={() => { setShowEditModal(false); resetForm(); setError(""); }}
>>>>>>> ThanhDH
        size="lg"
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <i className="bi bi-pencil-square me-2 text-primary"></i>
<<<<<<< HEAD
            Chỉnh sửa User
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={submitEdit}>
          <Modal.Body className="px-4">
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Họ và tên <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nhập họ và tên"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Email <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Nhập email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Số điện thoại</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="Nhập số điện thoại"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Vai trò</Form.Label>
                  <Form.Select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
=======
            Chỉnh sửa tài khoản
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={submitEdit} noValidate>
          <Modal.Body className="px-4">
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError("")} className="py-2">
                {error}
              </Alert>
            )}
            <Row className="g-3">
              <Col md={6}>
                <FieldGroup label="Họ và tên" required error={fieldErrors.fullName}>
                  <Form.Control
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    isInvalid={!!fieldErrors.fullName}
                    onChange={(e) => { field("fullName", e.target.value); clearFieldError("fullName"); }}
                  />
                </FieldGroup>
              </Col>
              <Col md={6}>
                <FieldGroup label="Email" required error={fieldErrors.email}>
                  <Form.Control
                    type="email"
                    placeholder="example@gmail.com"
                    value={formData.email}
                    isInvalid={!!fieldErrors.email}
                    onChange={(e) => { field("email", e.target.value); clearFieldError("email"); }}
                  />
                </FieldGroup>
              </Col>
              <Col md={12}>
                <FieldGroup label="Số điện thoại" error={fieldErrors.phone}>
                  <Form.Control
                    type="tel"
                    placeholder="Tối thiểu 10 số"
                    value={formData.phone}
                    isInvalid={!!fieldErrors.phone}
                    onChange={(e) => { field("phone", e.target.value); clearFieldError("phone"); }}
                  />
                </FieldGroup>
              </Col>
              <Col md={6}>
                <FieldGroup label="Vai trò">
                  <Form.Select
                    value={formData.role}
                    onChange={(e) => field("role", e.target.value)}
>>>>>>> ThanhDH
                  >
                    <option value="Customer">Khách hàng</option>
                    <option value="Staff">Nhân viên</option>
                    <option value="Admin">Quản trị viên</option>
                  </Form.Select>
<<<<<<< HEAD
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Trạng thái</Form.Label>
                  <Form.Select
                    value={formData.membershipStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        membershipStatus: e.target.value,
                      })
                    }
                  >
                    <option value="Active">Hoạt động</option>
                    <option value="Inactive">Chưa kích hoạt</option>
                    <option value="Suspended">Tạm khóa</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Alert variant="info" className="mt-3 mb-0">
              <i className="bi bi-info-circle me-2"></i>
              Không thể đổi mật khẩu ở đây. User cần dùng chức năng "Đổi mật
              khẩu" trong hồ sơ.
=======
                </FieldGroup>
              </Col>
              <Col md={6}>
                <FieldGroup label="Trạng thái">
                  <Form.Select
                    value={formData.membershipStatus}
                    onChange={(e) => field("membershipStatus", e.target.value)}
                  >
                    <option value="Active">Hoạt động</option>
                    <option value="Suspended">Tạm khóa</option>
                  </Form.Select>
                </FieldGroup>
              </Col>
            </Row>
            <Alert variant="info" className="mt-3 mb-0 py-2">
              <i className="bi bi-info-circle me-2"></i>
              Để thay đổi mật khẩu, người dùng cần dùng chức năng{" "}
              <strong>Đổi mật khẩu</strong> trong hồ sơ của họ.
>>>>>>> ThanhDH
            </Alert>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button
              variant="outline-secondary"
<<<<<<< HEAD
              onClick={() => setShowEditModal(false)}
            >
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              <i className="bi bi-check-lg me-1"></i>
=======
              onClick={() => { setShowEditModal(false); resetForm(); setError(""); }}
              disabled={formLoading}
            >
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={formLoading}>
              {formLoading ? (
                <Spinner size="sm" animation="border" className="me-1" />
              ) : (
                <i className="bi bi-check-lg me-1"></i>
              )}
>>>>>>> ThanhDH
              Lưu thay đổi
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

<<<<<<< HEAD
      {/* DELETE MODAL */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold text-danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Xác nhận xóa
=======
      {/* ══════════════════════════════════════════════
          LOCK MODAL (Tạm khóa)
      ══════════════════════════════════════════════ */}
      <Modal
        show={showLockModal}
        onHide={() => { setShowLockModal(false); setTargetUser(null); }}
        centered
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold text-warning">
            <i className="bi bi-lock-fill me-2"></i>
            Tạm khóa tài khoản
>>>>>>> ThanhDH
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4">
          <p className="mb-2">
<<<<<<< HEAD
            Bạn có chắc chắn muốn xóa người dùng{" "}
            <strong>{deletingUser?.fullName || deletingUser?.email}</strong>?
          </p>
          <Alert variant="warning" className="mb-0">
            <i className="bi bi-exclamation-circle me-2"></i>
            Hành động này không thể hoàn tác!
=======
            Bạn có chắc chắn muốn tạm khóa tài khoản{" "}
            <strong>{targetUser?.fullName || targetUser?.email}</strong>?
          </p>
          <Alert variant="warning" className="mb-0 py-2">
            <i className="bi bi-exclamation-circle me-2"></i>
            Tài khoản bị khóa sẽ <strong>không thể đăng nhập</strong> vào hệ
            thống cho đến khi được mở khóa.
>>>>>>> ThanhDH
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
<<<<<<< HEAD
            onClick={() => setShowDeleteModal(false)}
          >
            Hủy
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            <i className="bi bi-trash me-1"></i>
            Xóa User
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
=======
            onClick={() => { setShowLockModal(false); setTargetUser(null); }}
            disabled={formLoading}
          >
            Hủy
          </Button>
          <Button variant="warning" onClick={confirmLock} disabled={formLoading}>
            {formLoading ? (
              <Spinner size="sm" animation="border" className="me-1" />
            ) : (
              <i className="bi bi-lock-fill me-1"></i>
            )}
            Xác nhận khóa
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ══════════════════════════════════════════════
          UNLOCK MODAL (Mở khóa)
      ══════════════════════════════════════════════ */}
      <Modal
        show={showUnlockModal}
        onHide={() => { setShowUnlockModal(false); setTargetUser(null); }}
        centered
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold text-success">
            <i className="bi bi-unlock-fill me-2"></i>
            Mở khóa tài khoản
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4">
          <p className="mb-2">
            Bạn có chắc chắn muốn mở khóa tài khoản{" "}
            <strong>{targetUser?.fullName || targetUser?.email}</strong>?
          </p>
          <Alert variant="info" className="mb-0 py-2">
            <i className="bi bi-info-circle me-2"></i>
            Sau khi mở khóa, tài khoản có thể <strong>đăng nhập bình thường</strong>{" "}
            trở lại.
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            onClick={() => { setShowUnlockModal(false); setTargetUser(null); }}
            disabled={formLoading}
          >
            Hủy
          </Button>
          <Button variant="success" onClick={confirmUnlock} disabled={formLoading}>
            {formLoading ? (
              <Spinner size="sm" animation="border" className="me-1" />
            ) : (
              <i className="bi bi-unlock-fill me-1"></i>
            )}
            Xác nhận mở khóa
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
>>>>>>> ThanhDH
  );
}
