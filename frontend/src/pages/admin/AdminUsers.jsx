import { useState, useEffect } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Table,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useAuth } from "../../hooks/useAuth";
import { apiClient as api } from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";

export function meta() {
  return [
    { title: "Quản lý User | Nexus Admin" },
    { name: "description", content: "Quản lý người dùng Nexus Coworking" },
  ];
}

export default function AdminUsers() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      setUsers(data);
    } catch (err) {
      setError(err.message || "Lỗi khi tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
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
  };

  const submitAdd = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await api.post("/users", formData);
      setSuccess(res.message || "Thêm người dùng thành công!");
      setShowAddModal(false);
      resetForm();
      loadUsers();
    } catch (err) {
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
    setShowEditModal(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      // Don't send password in update (backend doesn't handle it)
      const { password, ...updateData } = formData;
      const res = await api.put(`/users/${editingId}`, updateData);
      setSuccess(res.message || "Cập nhật người dùng thành công!");
      setShowEditModal(false);
      resetForm();
      loadUsers();
    } catch (err) {
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
    <AdminLayout>
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
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted small mb-1">Tổng Users</p>
                    <h3 className="fw-bold mb-0">{users.length}</h3>
                  </div>
                  <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-people fs-4 text-primary"></i>
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

      {/* ADD MODAL */}
      <Modal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
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
                  >
                    <option value="Customer">Khách hàng</option>
                    <option value="Staff">Nhân viên</option>
                    <option value="Admin">Quản trị viên</option>
                  </Form.Select>
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
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button
              variant="outline-secondary"
              onClick={() => setShowAddModal(false)}
            >
              Hủy
            </Button>
            <Button variant="success" type="submit">
              <i className="bi bi-check-lg me-1"></i>
              Thêm User
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <i className="bi bi-pencil-square me-2 text-primary"></i>
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
                  >
                    <option value="Customer">Khách hàng</option>
                    <option value="Staff">Nhân viên</option>
                    <option value="Admin">Quản trị viên</option>
                  </Form.Select>
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
            </Alert>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button
              variant="outline-secondary"
              onClick={() => setShowEditModal(false)}
            >
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              <i className="bi bi-check-lg me-1"></i>
              Lưu thay đổi
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

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
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4">
          <p className="mb-2">
            Bạn có chắc chắn muốn xóa người dùng{" "}
            <strong>{deletingUser?.fullName || deletingUser?.email}</strong>?
          </p>
          <Alert variant="warning" className="mb-0">
            <i className="bi bi-exclamation-circle me-2"></i>
            Hành động này không thể hoàn tác!
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
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
    </AdminLayout>
  );
}
