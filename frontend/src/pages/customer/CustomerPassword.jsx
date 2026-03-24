import { useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Navigate } from "react-router";
import GuestCustomerNavbar from "../../components/common/GuestCustomerNavbar";
import PasswordChangeFormCard from "../../components/customer/forms/PasswordChangeFormCard";
import { changePasswordApi } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

export function meta() {
  return [{ title: "Đổi mật khẩu | Customer" }];
}

export default function CustomerPassword() {
  const { isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const onChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (message.text) setMessage({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: "danger", text: "Xác nhận mật khẩu không khớp." });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({
        type: "danger",
        text: "Mật khẩu mới phải có ít nhất 6 ký tự.",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await changePasswordApi({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      setMessage({
        type: "success",
        text: res?.message || "Đổi mật khẩu thành công.",
      });
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setMessage({
        type: "danger",
        text: error.message || "Đổi mật khẩu thất bại.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <GuestCustomerNavbar activeItem="orders" />

      <main className="py-5 flex-grow-1">
        <Container>
          <Row className="justify-content-center">
            <Col lg={8}>
              <PasswordChangeFormCard
                message={message}
                clearMessage={() => setMessage({ type: "", text: "" })}
                formData={formData}
                onChange={onChange}
                onSubmit={handleSubmit}
                loading={loading}
              />
            </Col>
          </Row>
        </Container>
      </main>
    </div>
  );
}
