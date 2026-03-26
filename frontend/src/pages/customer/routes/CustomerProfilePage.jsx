import { useState, useEffect } from "react";
import { Alert, Container } from "react-bootstrap";
import { useAuth } from "../../../hooks/useAuth";
import GuestCustomerNavbar from "../../../components/common/GuestCustomerNavbar";
import ProfileHeroCard from "../../../components/customer/cards/ProfileHeroCard";
import ProfileEditFormCard from "../../../components/customer/forms/ProfileEditFormCard";
import {
  sendProfileEmailOtpApi,
  verifyProfileEmailOtpApi,
} from "../../../services/api";

export default function CustomerProfilePage() {
  const { user } = useAuth();

  // State cho Form Thông tin cá nhân
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  // Quản lý thông báo (Alert) và trạng thái tải (Loading)
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loadingProfile, setLoadingProfile] = useState(false);
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

  // Load dữ liệu từ hook useAuth vào Form khi trang được render
  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user?.id]);

  // Hàm xử lý khi người dùng gõ vào ô input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (name === "email") {
      setEmailOtp("");
      setEmailOtpRequested(false);
      setEmailOtpVerified(false);
    }
  };

  const handleSendEmailOtp = async () => {
    try {
      if (emailOtpCooldown > 0) {
        setStatus({
          type: "danger",
          msg: `Vui lòng chờ ${emailOtpCooldown}s để gửi lại OTP.`,
        });
        return;
      }

      const currentEmail = String(user?.email || "")
        .trim()
        .toLowerCase();
      const nextEmail = String(profileData.email || "")
        .trim()
        .toLowerCase();

      if (!nextEmail) {
        setStatus({ type: "danger", msg: "Vui lòng nhập email mới." });
        return;
      }
      if (nextEmail === currentEmail) {
        setStatus({
          type: "danger",
          msg: "Email mới phải khác email hiện tại.",
        });
        return;
      }

      setEmailOtpSending(true);
      setStatus({ type: "", msg: "" });
      await sendProfileEmailOtpApi(nextEmail);
      setEmailOtp("");
      setEmailOtpRequested(true);
      setEmailOtpCooldown(60);
      setEmailOtpVerified(false);
      setStatus({
        type: "success",
        msg: "Đã gửi OTP tới email mới. Vui lòng nhập mã để xác nhận.",
      });
    } catch (error) {
      setStatus({
        type: "danger",
        msg: error.message || "Không gửi được OTP tới email mới.",
      });
    } finally {
      setEmailOtpSending(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    try {
      const nextEmail = String(profileData.email || "")
        .trim()
        .toLowerCase();
      const otp = String(emailOtp || "").trim();
      if (!nextEmail) {
        setStatus({ type: "danger", msg: "Vui lòng nhập email mới." });
        return;
      }
      if (!/^\d{6}$/.test(otp)) {
        setStatus({ type: "danger", msg: "OTP phải gồm 6 chữ số." });
        return;
      }

      setEmailOtpVerifying(true);
      setStatus({ type: "", msg: "" });
      await verifyProfileEmailOtpApi(nextEmail, otp);
      setEmailOtpVerified(true);
      setStatus({
        type: "success",
        msg: "Xác thực OTP email mới thành công. Bạn có thể lưu thay đổi.",
      });
    } catch (error) {
      setEmailOtpVerified(false);
      setStatus({
        type: "danger",
        msg: error.message || "Xác thực OTP không thành công.",
      });
    } finally {
      setEmailOtpVerifying(false);
    }
  };

  // Hàm Gửi yêu cầu Cập nhật Profile xuống Backend
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    setStatus({ type: "", msg: "" });

    try {
      const currentEmail = String(user?.email || "")
        .trim()
        .toLowerCase();
      const nextEmail = String(profileData.email || "")
        .trim()
        .toLowerCase();
      if (nextEmail !== currentEmail && !emailOtpVerified) {
        setStatus({
          type: "danger",
          msg: "Vui lòng xác thực OTP gửi tới email mới trước khi lưu.",
        });
        return;
      }

      const response = await fetch("http://localhost:5000/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        // Cập nhật lại thông tin mới vào Local Storage
        // Hook useAuth sẽ tự động quét và cập nhật UI (Avatar, Tên trên Navbar)
        localStorage.setItem("user", JSON.stringify(data));
        setEmailOtp("");
        setEmailOtpRequested(false);
        setEmailOtpVerified(false);
        setStatus({
          type: "success",
          msg: "Cập nhật thông tin cá nhân thành công!",
        });
      } else {
        setStatus({
          type: "danger",
          msg: data.message || "Cập nhật thất bại.",
        });
      }
    } catch (error) {
      setStatus({ type: "danger", msg: "Lỗi kết nối đến máy chủ." });
    } finally {
      setLoadingProfile(false);
    }
  };

  // Tạo Initials (Chữ cái đầu) cho Avatar
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .slice(-2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "KH";

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Navbar */}
      <GuestCustomerNavbar activeItem="orders" />

      {/* Main Content */}
      <main className="py-4 flex-grow-1">
        <Container style={{ maxWidth: "980px" }}>
          {/* Thông báo lỗi / thành công */}
          {status.msg && (
            <Alert
              variant={status.type}
              onClose={() => setStatus({ type: "", msg: "" })}
              dismissible
              className="shadow-sm mb-4"
            >
              {status.msg}
            </Alert>
          )}

          <ProfileHeroCard
            initials={initials}
            fullName={user?.fullName}
            email={user?.email}
          />

          <ProfileEditFormCard
            profileData={profileData}
            handleInputChange={handleInputChange}
            handleUpdateProfile={handleUpdateProfile}
            loadingProfile={loadingProfile}
            emailOtp={emailOtp}
            setEmailOtp={setEmailOtp}
            emailOtpVerified={emailOtpVerified}
            emailOtpRequested={emailOtpRequested}
            emailOtpCooldown={emailOtpCooldown}
            emailOtpSending={emailOtpSending}
            emailOtpVerifying={emailOtpVerifying}
            handleSendEmailOtp={handleSendEmailOtp}
            handleVerifyEmailOtp={handleVerifyEmailOtp}
            originalEmail={user?.email || ""}
          />
        </Container>
      </main>
    </div>
  );
}
