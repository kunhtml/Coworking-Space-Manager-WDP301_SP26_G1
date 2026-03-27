import { useEffect, useState } from "react";
import { Row, Col, Alert } from "react-bootstrap";
import { useAuth } from "../../hooks/useAuth";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminAccountStatusCard from "../../components/admin/AdminAccountStatusCard";
import AdminPasswordFormCard from "../../components/admin/AdminPasswordFormCard";
import AdminProfileInfoCard from "../../components/admin/AdminProfileInfoCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  changePasswordApi,
  getMeApi,
  sendProfileEmailOtpApi,
  updateProfileApi,
  verifyProfileEmailOtpApi,
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
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [emailOtpRequested, setEmailOtpRequested] = useState(false);
  const [emailOtpCooldown, setEmailOtpCooldown] = useState(0);
  const [emailOtpSending, setEmailOtpSending] = useState(false);
  const [emailOtpVerifying, setEmailOtpVerifying] = useState(false);

  useEffect(() => {
    if (emailOtpCooldown <= 0) return;
    const timerId = setTimeout(() => {
      setEmailOtpCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(timerId);
  }, [emailOtpCooldown]);

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
      setEmailOtp("");
      setEmailOtpVerified(false);
      setEmailOtpRequested(false);
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

      const currentEmail = String(profile?.email || "").toLowerCase();
      const nextEmail = String(email || "")
        .trim()
        .toLowerCase();
      const emailChanged = nextEmail !== currentEmail;
      if (emailChanged && !emailOtpVerified) {
        setMessage({
          type: "danger",
          content: "Vui lòng xác thực OTP gửi tới email mới trước khi lưu.",
        });
        return;
      }

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
      setEmailOtp("");
      setEmailOtpVerified(false);
      setEmailOtpRequested(false);

      const rawUser = localStorage.getItem("user");
      const existingUser = rawUser ? JSON.parse(rawUser) : {};
      localStorage.setItem(
        "user",
        JSON.stringify({ ...existingUser, ...updated }),
      );

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
    setEmail(profile?.email || "");
    setPhone(profile?.phone || "");
    setEmailOtp("");
    setEmailOtpVerified(false);
    setEmailOtpRequested(false);
    setEditMode(false);
    setMessage({ type: "", content: "" });
  };

  const handleSendEmailOtp = async () => {
    try {
      if (emailOtpCooldown > 0) {
        setMessage({
          type: "danger",
          content: `Vui lòng chờ ${emailOtpCooldown}s để gửi lại OTP.`,
        });
        return;
      }

      const currentEmail = String(profile?.email || "").toLowerCase();
      const nextEmail = String(email || "")
        .trim()
        .toLowerCase();
      if (!nextEmail) {
        setMessage({ type: "danger", content: "Vui lòng nhập email mới." });
        return;
      }
      if (nextEmail === currentEmail) {
        setMessage({
          type: "danger",
          content: "Email mới phải khác email hiện tại.",
        });
        return;
      }

      setEmailOtpSending(true);
      setMessage({ type: "", content: "" });
      await sendProfileEmailOtpApi(nextEmail);
      setEmailOtp("");
      setEmailOtpRequested(true);
      setEmailOtpCooldown(60);
      setEmailOtpVerified(false);
      setMessage({
        type: "success",
        content: "Đã gửi OTP tới email mới. Vui lòng nhập mã để xác nhận.",
      });
    } catch (error) {
      setMessage({
        type: "danger",
        content: error.message || "Không gửi được OTP tới email mới.",
      });
    } finally {
      setEmailOtpSending(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    try {
      const nextEmail = String(email || "")
        .trim()
        .toLowerCase();
      if (!nextEmail) {
        setMessage({ type: "danger", content: "Vui lòng nhập email mới." });
        return;
      }
      if (!/^\d{6}$/.test(String(emailOtp || "").trim())) {
        setMessage({ type: "danger", content: "OTP phải gồm 6 chữ số." });
        return;
      }

      setEmailOtpVerifying(true);
      setMessage({ type: "", content: "" });
      await verifyProfileEmailOtpApi(nextEmail, String(emailOtp).trim());
      setEmailOtpVerified(true);
      setMessage({
        type: "success",
        content: "Xác thực OTP email mới thành công. Bạn có thể lưu thay đổi.",
      });
    } catch (error) {
      setEmailOtpVerified(false);
      setMessage({
        type: "danger",
        content: error.message || "Xác thực OTP không thành công.",
      });
    } finally {
      setEmailOtpVerifying(false);
    }
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    setEmailOtp("");
    setEmailOtpRequested(false);
    setEmailOtpVerified(false);
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
                  setEmail={handleEmailChange}
                  emailOtp={emailOtp}
                  setEmailOtp={setEmailOtp}
                  emailOtpVerified={emailOtpVerified}
                  emailOtpRequested={emailOtpRequested}
                  emailOtpCooldown={emailOtpCooldown}
                  emailOtpSending={emailOtpSending}
                  emailOtpVerifying={emailOtpVerifying}
                  handleSendEmailOtp={handleSendEmailOtp}
                  handleVerifyEmailOtp={handleVerifyEmailOtp}
                  originalEmail={profile?.email || ""}
                  phone={phone}
                  setPhone={setPhone}
                  profile={profile}
                  roleInfo={roleInfo}
                />
              </Col>

              {/* Account Status Card */}
              <Col lg={4}>
                <AdminAccountStatusCard
                  statusInfo={statusInfo}
                  formatDate={formatDate}
                  profile={profile}
                />
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
