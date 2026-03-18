import { Badge, Button, Dropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router"; // Lưu ý: dùng "react-router-dom" nếu bản cũ của bạn bị lỗi
import { useAuth } from "../../hooks/useAuth";

const DEFAULT_ROLE_LABELS = {
  Admin: { label: "Quản trị", icon: "bi-shield-lock-fill", color: "#ffc107" },
  Staff: { label: "Nhân viên", icon: "bi-briefcase-fill", color: "#4dabf7" },
  Customer: { label: "Tài khoản", icon: "bi-person-circle", color: "#74c0fc" },
};

function getDashboardPath(role) {
  if (role === "Admin") return "/admin";
  if (role === "Staff") return "/dashboard";
  if (role === "Customer") return "/customer-dashboard";
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

  const role = user?.role;
  const roleMeta = roleLabels[role] ?? {
    label: role,
    icon: "bi-person-circle",
    color: "#aaa",
  };
  const dashboardPath = getDashboardPath(role);

  return (
    <div className="d-flex gap-2 ms-lg-3 mt-2 mt-lg-0 align-items-center">
      {isAuthenticated && user ? (
        <Dropdown align="end">
          <Dropdown.Toggle
            variant="outline-secondary"
            className="px-3 rounded-0 fw-medium text-light border-secondary d-flex align-items-center gap-2"
            style={{ backgroundColor: "transparent" }}
          >
            <i 
              className={`bi ${roleMeta.icon ?? "bi-person-circle"}`} 
              style={{ color: roleMeta.color ?? "#aaa" }}
            ></i>
            <span>{displayName || user.fullName}</span>
            <Badge
              pill
              style={{
                backgroundColor: roleMeta.color ?? "#aaa",
                color: "#000",
                fontSize: "0.65rem",
              }}
            >
              {roleMeta.label ?? role}
            </Badge>
          </Dropdown.Toggle>

          <Dropdown.Menu className="bg-dark border-secondary shadow" style={{ minWidth: "200px" }}>
            {/* Mục Hồ sơ cá nhân - Đã thêm lại */}
            <Dropdown.Item as={Link} to="/profile" className="text-light py-2">
              <i className="bi bi-person-lines-fill me-2 text-secondary"></i>Hồ sơ cá nhân
            </Dropdown.Item>

            {dashboardPath && (
              <Dropdown.Item as={Link} to={dashboardPath} className="text-light py-2">
                <i className="bi bi-speedometer2 me-2 text-secondary"></i>
                {role === "Admin" ? "Trang quản trị" : "Bảng điều khiển"}
              </Dropdown.Item>
            )}

            <Dropdown.Divider className="border-secondary" />
            
            <Dropdown.Item onClick={handleLogout} className="text-danger py-2">
              <i className="bi bi-box-arrow-right me-2"></i>Đăng xuất
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      ) : (
        <div className="d-flex gap-2">
          {/* Nút Đăng nhập */}
          <Button
            as={Link}
            to="/login"
            variant="outline-secondary"
            className="px-4 rounded-0 fw-medium text-uppercase text-light border-secondary"
            style={{ fontSize: "0.85rem", letterSpacing: "1px" }}
          >
            {loginText}
          </Button>

          {/* Nút Đăng ký */}
          <Button
            as={Link}
            to="/register"
            className="px-4 rounded-0 fw-medium text-uppercase border-0 text-dark"
            style={{ 
              backgroundColor: "#d4a373", 
              fontSize: "0.85rem", 
              letterSpacing: "1px" 
            }}
          >
            Đăng ký
          </Button>
        </div>
      )}
    </div>
  );
}