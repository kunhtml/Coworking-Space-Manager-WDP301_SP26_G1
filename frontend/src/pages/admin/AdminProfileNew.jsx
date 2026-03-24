import { useEffect, useState } from "react";
import {
  Row,
  Col,
  Alert,
} from "react-bootstrap";
import { useAuth } from "../../hooks/useAuth";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminAccountStatusCard from "../../components/admin/AdminAccountStatusCard";
import AdminPasswordFormCard from "../../components/admin/AdminPasswordFormCard";
import AdminProfileInfoCard from "../../components/admin/AdminProfileInfoCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  changePasswordApi,
  getMeApi,
  updateProfileApi,
} from "../../services/api";

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

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({
    type: "",
    content: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    loadProfile();
  }, [isAuthenticated]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getMeApi();
      const nextProfile = { ...authUser, ...data };

      setProfile(nextProfile);
      setFullName(nextProfile.fullName || "");
      setEmail(nextProfile.email || "");
      setPhone(nextProfile.phone || "");
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

      const updated = await updateProfileApi({
        fullName,
        email,
        phone,
      });

      setMessage({
        type: "success",
        content: "Cập nhật hồ sơ thành công!",
      });

      setProfile((prev) => ({ ...prev, ...updated }));
      setFullName(updated.fullName || fullName);
      setEmail(updated.email || email);
      setPhone(updated.phone || phone);

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

  const onPasswordChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    if (passwordMessage.content) {
      setPasswordMessage({ type: "", content: "" });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: "", content: "" });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({
        type: "danger",
        content: "Mật khẩu mới và xác nhận mật khẩu không khớp.",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({
        type: "danger",
        content: "Mật khẩu mới phải có ít nhất 6 ký tự.",
      });
      return;
    }

    try {
      setPasswordLoading(true);
      await changePasswordApi({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      setPasswordMessage({
        type: "success",
        content: "Đổi mật khẩu thành công!",
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setPasswordMessage({
        type: "danger",
        content: error.message || "Không thể đổi mật khẩu.",
      });
    } finally {
      setPasswordLoading(false);
    }
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
          <LoadingSpinner text="Đang tải thông tin hồ sơ..." color="#0d6efd" />
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
                <AdminProfileInfoCard
                  editMode={editMode}
                  setEditMode={setEditMode}
                  updateLoading={updateLoading}
                  handleUpdateProfile={handleUpdateProfile}
                  cancelEdit={cancelEdit}
                  fullName={fullName}
                  setFullName={setFullName}
                  email={email}
                  phone={phone}
                  setPhone={setPhone}
                  profile={profile}
                  roleInfo={roleInfo}
                />
              </Col>

              {/* Account Status Card */}
              <Col lg={4}>
                <AdminAccountStatusCard statusInfo={statusInfo} formatDate={formatDate} profile={profile} />
              </Col>
            </Row>

            <Row className="g-4 mt-1">
              <Col lg={8}>
                <AdminPasswordFormCard
                  passwordMessage={passwordMessage}
                  setPasswordMessage={setPasswordMessage}
                  handleChangePassword={handleChangePassword}
                  passwordForm={passwordForm}
                  onPasswordChange={onPasswordChange}
                  passwordLoading={passwordLoading}
                />
              </Col>
            </Row>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
