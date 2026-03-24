import { useState, useEffect } from "react";
import { Alert, Container } from "react-bootstrap";
import { useAuth } from "../../../hooks/useAuth";
import GuestCustomerNavbar from "../../../components/common/GuestCustomerNavbar";
import ProfileHeroCard from "../../../components/customer/cards/ProfileHeroCard";
import ProfileEditFormCard from "../../../components/customer/forms/ProfileEditFormCard";

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
  };

  // Hàm Gửi yêu cầu Cập nhật Profile xuống Backend
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    setStatus({ type: "", msg: "" });

    try {
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
        setStatus({ type: "success", msg: "Cập nhật thông tin cá nhân thành công!" });
      } else {
        setStatus({ type: "danger", msg: data.message || "Cập nhật thất bại." });
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
          />

        </Container>
      </main>
    </div>
  );
}
