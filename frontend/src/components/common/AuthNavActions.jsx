import { Badge, Button, Dropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router";
// Sửa lại đường dẫn import useAuth cho đúng với file của bạn nếu cần
import { useAuth } from "../../hooks/useAuth";

// 1. Sửa lại key thành chữ thường (lowercase) để khớp 100% với Database
const DEFAULT_ROLE_LABELS = {
  admin: { label: "Quản trị", icon: "bi-shield-lock-fill", color: "#ffc107" },
  staff: { label: "Nhân viên", icon: "bi-briefcase-fill", color: "#4dabf7" },
  customer: { label: "Khách hàng", icon: "bi-person-circle", color: "#74c0fc" },
};

function getDashboardPath(role) {
  // Chuẩn hóa về chữ thường trước khi check
  const r = role?.toLowerCase();
  if (r === "admin") return "/admin-dashboard";
  if (r === "staff") return "/staff-dashboard";
  if (r === "customer") return "/customer-dashboard";
  return null;
}

export default function AuthNavActions({
  displayName,
  roleLabels = DEFAULT_ROLE_LABELS,
  loginText = "Đăng nhập",
}) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // 2. Chuẩn hóa role của user về chữ thường
  const role = user?.role?.toLowerCase();
  const roleMeta = roleLabels[role] ?? {
    label: role,
    icon: "bi-person-circle",
    color: "#aaa",
  };
  const dashboardPath = getDashboardPath(role);
  const isCustomer = role === "Customer";

  return (
    <div className="d-flex gap-2 ms-lg-3 mt-2 mt-lg-0">
      {isAuthenticated && user ? (
        <Dropdown align="end">
          {/* 3. Đổi text-light thành text-dark để dễ nhìn trên nền trắng */}
          <Dropdown.Toggle
            variant="outline-secondary"
            className="px-3 py-2 rounded-1 fw-medium text-dark border-secondary d-flex align-items-center gap-2"
            style={{ backgroundColor: "transparent" }}
          >
            <span
              className="d-inline-flex align-items-center justify-content-center rounded-circle border border-secondary"
              style={{
                width: "30px",
                height: "30px",
                flexShrink: 0,
              }}
            >
              <i
                className={`bi ${roleMeta.icon ?? "bi-person-circle"}`}
                style={{ color: roleMeta.color ?? "#aaa" }}
              ></i>
            </span>
            <span className="d-flex flex-column align-items-start lh-sm me-1">
              <span className="small text-muted">Tài khoản</span>
              <span
                className="fw-semibold text-truncate"
                style={{ maxWidth: "140px" }}
              >
                {displayName || user.fullName}
              </span>
            </span>
          </Dropdown.Toggle>

          <Dropdown.Menu
            className={
              isCustomer
                ? "bg-white border-0 shadow-sm mt-2"
                : "bg-dark border-secondary mt-2"
            }
            style={{ minWidth: "200px" }}
          >
            <div
              className={`px-3 py-2 border-bottom ${
                isCustomer ? "border-light" : "border-secondary-subtle"
              }`}
            >
              <div
                className={`${
                  isCustomer ? "text-dark" : "text-light"
                } fw-semibold small text-truncate`}
              >
                {displayName || user.fullName}
              </div>
              <Badge
                pill
                style={{
                  backgroundColor: roleMeta.color ?? "#aaa",
                  color: "#000",
                  fontSize: "0.7rem",
                  marginTop: "4px"
                }}
              >
                {roleMeta.label ?? role}
              </Badge>
            </div>
            
            {dashboardPath &&
              (isCustomer ? (
                <>
                  <Dropdown.Item
                    as={Link}
                    to="/customer-dashboard/profile"
                    className="text-secondary py-2"
                  >
                    <i className="bi bi-person-circle me-2"></i>
                    Hồ sơ cá nhân
                  </Dropdown.Item>
                  <Dropdown.Item
                    as={Link}
                    to="/customer-dashboard/orders"
                    className="text-secondary py-2"
                  >
                    <i className="bi bi-card-list me-2"></i>
                    Đơn hàng của tôi
                  </Dropdown.Item>
                  <Dropdown.Item
                    as={Link}
                    to="/customer-dashboard/password"
                    className="text-secondary py-2"
                  >
                    <i className="bi bi-key-fill me-2"></i>
                    Đổi mật khẩu
                  </Dropdown.Item>
                </>
              ) : (
                <Dropdown.Item
                  as={Link}
                  to={dashboardPath}
                  className="text-light py-2"
                >
                  <i className="bi bi-speedometer2 me-2"></i>
                  {role === "admin" ? "Trang Quản trị" : "Dashboard"}
                </Dropdown.Item>
              ))}
            <Dropdown.Divider
              className={isCustomer ? "border-light" : "border-secondary"}
            />
            <Dropdown.Item onClick={handleLogout} className="text-danger py-2 fw-medium">
              <i className="bi bi-box-arrow-right me-2"></i>Đăng xuất
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      ) : (
        <>
          <Button
            as={Link}
            to="/login"
            variant="outline-warning"
            className="px-4 rounded-0 fw-medium text-uppercase"
            style={{ borderColor: "#d4a373", color: "#d4a373" }}
          >
            {loginText}
          </Button>
          <Button
            as={Link}
            to="/register"
            variant="warning"
            className="px-4 rounded-0 fw-medium text-uppercase"
            style={{
              backgroundColor: "#d4a373",
              borderColor: "#d4a373",
              color: "#000",
            }}
          >
            Đăng ký
          </Button>
        </>
      )}
    </div>
  );
}
