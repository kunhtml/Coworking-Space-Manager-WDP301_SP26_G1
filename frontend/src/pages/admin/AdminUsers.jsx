import { useState, useEffect, useCallback } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Form,
  Row,
  Alert,
  Spinner,
} from "react-bootstrap";
import { apiClient as api } from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminUserTable from "../../components/admin/AdminUserTable";
import SummaryCard from "../../components/admin/SummaryCard";
import UserFormModal from "../../components/admin/UserFormModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import EmptyState from "../../components/common/EmptyState";
import FilterBar from "../../components/common/FilterBar";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SearchInput from "../../components/common/SearchInput";

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

const STRICT_EMAIL_REGEX =
  /^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*@[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)+$/;

// ─── Validation ───────────────────────────────────────────────────────────────
const validateAddForm = (form) => {
  const errors = {};

  if (!form.fullName.trim()) {
    errors.fullName = "Họ và tên không được để trống.";
  }

  if (!form.email.trim()) {
    errors.email = "Email không được để trống.";
  } else if (!STRICT_EMAIL_REGEX.test(form.email.trim().toLowerCase())) {
    errors.email = "Email không đúng định dạng.";
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
  } else if (!STRICT_EMAIL_REGEX.test(form.email.trim().toLowerCase())) {
    errors.email = "Email không đúng định dạng.";
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
  const [showLockModal, setShowLockModal] = useState(false); // Khóa tài khoản
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
    admin: allUsers.filter((u) => (u.role || "").toLowerCase() === "admin")
      .length,
    staff: allUsers.filter((u) => (u.role || "").toLowerCase() === "staff")
      .length,
    customer: allUsers.filter(
      (u) => (u.role || "").toLowerCase() === "customer",
    ).length,
    suspended: allUsers.filter(
      (u) => (u.membershipStatus || "").toLowerCase() === "suspended",
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
      showSuccess(
        res.message ||
          `Đã khóa tài khoản ${targetUser.fullName || targetUser.email}.`,
      );
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
      showSuccess(
        res.message ||
          `Đã mở khóa tài khoản ${targetUser.fullName || targetUser.email}.`,
      );
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
        <Col md={3}>
          <SummaryCard
            label="Tổng tài khoản"
            value={stats.total}
            icon="bi-people"
            color="primary"
          />
        </Col>
        <Col md={3}>
          <SummaryCard
            label="Quản trị viên"
            value={stats.admin}
            icon="bi-shield-fill"
            color="danger"
          />
        </Col>
        <Col md={3}>
          <SummaryCard
            label="Nhân viên"
            value={stats.staff}
            icon="bi-person-badge"
            color="info"
          />
        </Col>
        <Col md={3}>
          <SummaryCard
            label="Khách hàng"
            value={stats.customer}
            icon="bi-person-check"
            color="success"
          />
        </Col>
        <Col md={12}>
          <SummaryCard
            label="Đang bị khóa"
            value={stats.suspended}
            icon="bi-lock-fill"
            color="warning"
          />
        </Col>
      </Row>

      {/* Search & Filter */}
      <Card className="shadow-sm border-0 rounded-3 mb-4">
        <Card.Body className="p-3">
          <FilterBar className="mb-0">
            <Col md={5}>
              <SearchInput
                placeholder="Tìm theo tên, email, số điện thoại..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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
                onClick={() => {
                  setSearch("");
                  setFilterRole("Tất cả");
                  setFilterStatus("Tất cả");
                }}
                title="Xóa bộ lọc"
              >
                <i className="bi bi-arrow-counterclockwise"></i>
              </Button>
            </Col>
          </FilterBar>
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
            <LoadingSpinner text="Đang tải..." color="#0d6efd" />
          ) : users.length === 0 ? (
            <div className="text-center py-4">
              <EmptyState
                icon="📭"
                title={
                  search || filterRole !== "Tất cả" || filterStatus !== "Tất cả"
                    ? "Không tìm thấy tài khoản phù hợp."
                    : "Chưa có tài khoản nào."
                }
              />
              <Button variant="primary" onClick={openAdd}>
                Thêm tài khoản đầu tiên
              </Button>
            </div>
          ) : (
            <AdminUserTable
              data={users}
              roleMap={ROLE_MAP}
              statusMap={STATUS_MAP}
              onEdit={openEdit}
              onToggleStatus={(u, mode) => {
                if (mode === "unlock") {
                  openUnlock(u);
                } else {
                  openLock(u);
                }
              }}
            />
          )}
        </Card.Body>
      </Card>

      <UserFormModal
        show={showAddModal}
        onHide={() => {
          setShowAddModal(false);
          resetForm();
          setError("");
        }}
        onSubmit={submitAdd}
        formData={formData}
        fieldErrors={fieldErrors}
        formLoading={formLoading}
        error={error}
        clearError={() => setError("")}
        title="Thêm tài khoản mới"
        submitText="Thêm tài khoản"
        mode="add"
        onField={field}
        onClearFieldError={clearFieldError}
      />

      <UserFormModal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          resetForm();
          setError("");
        }}
        onSubmit={submitEdit}
        formData={formData}
        fieldErrors={fieldErrors}
        formLoading={formLoading}
        error={error}
        clearError={() => setError("")}
        title="Chỉnh sửa tài khoản"
        submitText="Lưu thay đổi"
        mode="edit"
        onField={field}
        onClearFieldError={clearFieldError}
      />

      <ConfirmDialog
        show={showLockModal}
        onCancel={() => {
          setShowLockModal(false);
          setTargetUser(null);
        }}
        onConfirm={confirmLock}
        loading={formLoading}
        title="Tạm khóa tài khoản"
        message={`Bạn có chắc chắn muốn tạm khóa tài khoản ${targetUser?.fullName || targetUser?.email || ""}?`}
        confirmText="Xác nhận khóa"
        cancelText="Hủy"
      />

      <ConfirmDialog
        show={showUnlockModal}
        onCancel={() => {
          setShowUnlockModal(false);
          setTargetUser(null);
        }}
        onConfirm={confirmUnlock}
        loading={formLoading}
        title="Mở khóa tài khoản"
        message={`Bạn có chắc chắn muốn mở khóa tài khoản ${targetUser?.fullName || targetUser?.email || ""}?`}
        confirmText="Xác nhận mở khóa"
        cancelText="Hủy"
      />
    </AdminLayout>
  );
}
