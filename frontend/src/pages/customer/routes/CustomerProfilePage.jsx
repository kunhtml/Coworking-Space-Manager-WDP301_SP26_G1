import { useState, useEffect } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Alert,
  Spinner
} from "react-bootstrap";
import { useAuth } from "../../../hooks/useAuth";
import GuestCustomerNavbar from "../../../components/common/GuestCustomerNavbar";

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

          {/* Card Header: Avatar & Tên (Hiển thị) */}
          <Card className="border-0 shadow-sm overflow-hidden mb-4">
            <div
              style={{
                height: "100px",
                background: "linear-gradient(90deg, #6366f1 0%, #7c3aed 100%)",
              }}
            ></div>
            <Card.Body style={{ marginTop: "-42px" }}>
              <div
                className="rounded-circle bg-white border d-flex align-items-center justify-content-center fw-bold text-primary shadow-sm"
                style={{ width: "84px", height: "84px", fontSize: "40px" }}
              >
                {initials}
              </div>
              <h3 className="fw-bold mt-3 mb-1">{user?.fullName || "Khách hàng"}</h3>
              <p className="text-secondary fw-semibold mb-3">
                {user?.email || "Chưa có email"}
              </p>
            </Card.Body>
          </Card>

          {/* Card Form: Chỉnh sửa thông tin cá nhân */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-bottom py-3">
              <h5 className="fw-bold mb-0">
                <i className="bi bi-pencil-fill text-primary me-2"></i>
                Chỉnh sửa thông tin
              </h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleUpdateProfile}>
                <Row className="g-3">
                  <Col md={12}>
                    <Form.Label className="fw-semibold">Họ và tên</Form.Label>
                    <Form.Control
                      name="fullName"
                      value={profileData.fullName}
                      onChange={handleInputChange}
                      placeholder="Nhập họ và tên"
                      required
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Label className="fw-semibold">Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      placeholder="Nhập email"
                      required
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Label className="fw-semibold">Số điện thoại</Form.Label>
                    <Form.Control
                      type="text"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      placeholder="Nhập số điện thoại"
                    />
                  </Col>
                </Row>
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <Button 
                    type="submit" 
                    className="staff-secondary-btn px-4" 
                    style={{ backgroundColor: "#6366f1", border: "none", color: "#fff" }}
                    disabled={loadingProfile}
                  >
                    {loadingProfile ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <><i className="bi bi-floppy me-2"></i>Lưu thông tin</>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

        </Container>
      </main>
    </div>
  );
}
