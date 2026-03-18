import { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";
import { useAuth } from "../../hooks/useAuth";
import AdminLayout from "../../components/admin/AdminLayout";

export function meta() {
  return [{ title: "Hồ sơ Admin | Nexus Admin" }];
}

function formatDate(iso) {
  if (!iso) return "--";
  return new Date(iso).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function AdminProfile() {
  const { user: authUser, isAuthenticated } = useAuth();
  const passwordPath =
    authUser?.role === "Admin"
      ? "/admin-dashboard/password"
      : "/staff-dashboard/password";

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit profile state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Form states
  const [editMode, setEditMode] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", content: "" });

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    loadProfile();
  }, [isAuthenticated]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // In a real app, you'd make an API call here
      // const data = await getMeApi();

      // For now, use the auth user data
      const mockProfile = {
        ...authUser,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        membershipStatus: "Active",
      };

      setProfile(mockProfile);
      setFullName(mockProfile.fullName || "");
      setEmail(mockProfile.email || "");
      setPhone(mockProfile.phone || "");
    } catch (error) {
      setMessage({
        type: "danger",
        content: error.message || "Lỗi khi tải thông tin hồ sơ",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setUpdateLoading(true);
      setMessage({ type: "", content: "" });

      // In a real app, you'd make an API call here
      // await updateProfileApi({ fullName, phone });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setMessage({
        type: "success",
        content: "Cập nhật hồ sơ thành công!",
      });

      // Update local profile state
      setProfile((prev) => ({
        ...prev,
        fullName,
        phone,
      }));

      setEditMode(false);
    } catch (error) {
      setMessage({
        type: "danger",
        content: error.message || "Lỗi khi cập nhật hồ sơ",
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const cancelEdit = () => {
    setFullName(profile?.fullName || "");
    setPhone(profile?.phone || "");
    setEditMode(false);
    setMessage({ type: "", content: "" });
  };

  // Status mapping
  const statusInfo = {
    Active: { label: "Hoạt động", bg: "success" },
    Inactive: { label: "Chưa kích hoạt", bg: "warning" },
    Suspended: { label: "Tạm khóa", bg: "danger" },
  }[profile?.membershipStatus] || {
    label: profile?.membershipStatus || "--",
    bg: "secondary",
  };

  const roleInfo = {
    Admin: { label: "Quản trị viên", bg: "danger" },
    Staff: { label: "Nhân viên", bg: "primary" },
    Customer: { label: "Khách hàng", bg: "secondary" },
  }[profile?.role] || {
    label: profile?.role || "--",
    bg: "secondary",
  };

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <Row className="mb-4 align-items-center">
          <Col>
            <h2 className="fw-bold mb-1">
              <i className="bi bi-person-badge me-2 text-primary"></i>
              Hồ sơ cá nhân
            </h2>
            <p className="text-muted mb-0">
              Xem và cập nhật thông tin tài khoản quản trị
            </p>
          </Col>
        </Row>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="text-muted mt-3 mb-0">Đang tải thông tin hồ sơ...</p>
          </div>
        ) : !profile ? (
          <Alert variant="warning" className="text-center">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Không thể tải thông tin hồ sơ. Vui lòng thử lại.
          </Alert>
        ) : (
          <>
            {/* Alert Messages */}
            {message.content && (
              <Alert
                variant={message.type}
                dismissible
                onClose={() => setMessage({ type: "", content: "" })}
                className="mb-4"
              >
                <i
                  className={`bi ${
                    message.type === "success"
                      ? "bi-check-circle"
                      : "bi-exclamation-triangle"
                  } me-2`}
                ></i>
                {message.content}
              </Alert>
            )}

            <Row className="g-4">
              {/* Profile Info Card */}
              <Col lg={8}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Header className="bg-white border-0 pb-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0 fw-semibold">
                        <i className="bi bi-person-lines-fill text-primary me-2"></i>
                        Thông tin cơ bản
                      </h5>
                      {!editMode ? (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => setEditMode(true)}
                        >
                          <i className="bi bi-pencil me-1"></i>
                          Chỉnh sửa
                        </Button>
                      ) : (
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={cancelEdit}
                            disabled={updateLoading}
                          >
                            Hủy
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
                                <i className="bi bi-check-lg me-1"></i>
                                Lưu
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
                                Họ và tên <span className="text-danger">*</span>
                              </Form.Label>
                              <Form.Control
                                type="text"
                                placeholder="Nhập họ và tên"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="fw-semibold">
                                Email
                              </Form.Label>
                              <Form.Control
                                type="email"
                                value={email}
                                disabled
                                className="bg-light"
                              />
                              <Form.Text className="text-muted">
                                Email không thể thay đổi
                              </Form.Text>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="fw-semibold">
                                Số điện thoại
                              </Form.Label>
                              <Form.Control
                                type="tel"
                                placeholder="Nhập số điện thoại"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      </Form>
                    ) : (
                      <Row className="g-4">
                        <Col md={6}>
                          <div>
                            <label className="form-label fw-semibold text-muted small">
                              HỌ VÀ TÊN
                            </label>
                            <p className="mb-0 fw-medium">
                              {profile.fullName || "Chưa cập nhật"}
                            </p>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div>
                            <label className="form-label fw-semibold text-muted small">
                              EMAIL
                            </label>
                            <p className="mb-0 fw-medium">{profile.email}</p>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div>
                            <label className="form-label fw-semibold text-muted small">
                              SỐ ĐIỆN THOẠI
                            </label>
                            <p className="mb-0 fw-medium">
                              {profile.phone || "Chưa cập nhật"}
                            </p>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div>
                            <label className="form-label fw-semibold text-muted small">
                              VAI TRÒ
                            </label>
                            <p className="mb-0">
                              <Badge bg={roleInfo.bg} className="px-2 py-1">
                                {roleInfo.label}
                              </Badge>
                            </p>
                          </div>
                        </Col>
                      </Row>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              {/* Account Status Card */}
              <Col lg={4}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Header className="bg-white border-0 pb-0">
                    <h5 className="mb-0 fw-semibold">
                      <i className="bi bi-shield-check text-primary me-2"></i>
                      Thông tin tài khoản
                    </h5>
                  </Card.Header>
                  <Card.Body className="pt-4">
                    <div className="mb-4">
                      <label className="form-label fw-semibold text-muted small">
                        TRẠNG THÁI TÀI KHOẢN
                      </label>
                      <p className="mb-0">
                        <Badge bg={statusInfo.bg} className="px-3 py-2 fs-6">
                          <i
                            className="bi bi-circle-fill me-1"
                            style={{ fontSize: "0.5rem" }}
                          ></i>
                          {statusInfo.label}
                        </Badge>
                      </p>
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-semibold text-muted small">
                        NGÀY TẠO TÀI KHOẢN
                      </label>
                      <p className="mb-0 fw-medium">
                        <i className="bi bi-calendar-date me-2 text-muted"></i>
                        {formatDate(profile.createdAt)}
                      </p>
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-semibold text-muted small">
                        ĐĂNG NHẬP GẦN NHẤT
                      </label>
                      <p className="mb-0 fw-medium">
                        <i className="bi bi-clock me-2 text-muted"></i>
                        {formatDate(profile.lastLoginAt)}
                      </p>
                    </div>

                    <div className="border-top pt-3">
                      <Button
                        variant="outline-warning"
                        size="sm"
                        className="w-100"
                        href={passwordPath}
                      >
                        <i className="bi bi-key me-2"></i>
                        Đổi mật khẩu
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
