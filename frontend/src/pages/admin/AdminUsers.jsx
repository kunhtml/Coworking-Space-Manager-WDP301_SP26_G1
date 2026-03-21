import { useState, useEffect, useCallback } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Form,
  InputGroup,
  Modal,
  Row,
  Table,
  Alert,
  Spinner,
} from "react-bootstrap";
import { apiClient as api } from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";

export function meta() {
  return [
    { title: "Quản lý Tài khoản | Nexus Admin" },
    { name: "description", content: "Quản lý người dùng Nexus Coworking" },
  ];
}

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      setUsers(data);
    } catch (err) {
      setError(err.message || "Lỗi khi tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
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
  };

  const submitAdd = async (e) => {
    e.preventDefault();
    setError("");

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
      setShowAddModal(false);
      resetForm();
      loadUsers();
    } catch (err) {
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
    setShowEditModal(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setError("");

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
      setShowEditModal(false);
      resetForm();
      loadUsers();
    } catch (err) {
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
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted small mb-1">{s.label}</p>
                    <h3 className="fw-bold mb-0">{s.value}</h3>
                  </div>
                  <div className={`bg-${s.color} bg-opacity-10 rounded-circle p-3`}>
                    <i className={`bi ${s.icon} fs-4 text-${s.color}`}></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
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
        size="lg"
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
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
                  >
                    <option value="Customer">Khách hàng</option>
                    <option value="Staff">Nhân viên</option>
                    <option value="Admin">Quản trị viên</option>
                  </Form.Select>
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
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button
              variant="outline-secondary"
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
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ══════════════════════════════════════════════
          EDIT MODAL
      ══════════════════════════════════════════════ */}
      <Modal
        show={showEditModal}
        onHide={() => { setShowEditModal(false); resetForm(); setError(""); }}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <i className="bi bi-pencil-square me-2 text-primary"></i>
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
                  >
                    <option value="Customer">Khách hàng</option>
                    <option value="Staff">Nhân viên</option>
                    <option value="Admin">Quản trị viên</option>
                  </Form.Select>
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
            </Alert>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button
              variant="outline-secondary"
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
              Lưu thay đổi
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

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
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4">
          <p className="mb-2">
            Bạn có chắc chắn muốn tạm khóa tài khoản{" "}
            <strong>{targetUser?.fullName || targetUser?.email}</strong>?
          </p>
          <Alert variant="warning" className="mb-0 py-2">
            <i className="bi bi-exclamation-circle me-2"></i>
            Tài khoản bị khóa sẽ <strong>không thể đăng nhập</strong> vào hệ
            thống cho đến khi được mở khóa.
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
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
  );
}
