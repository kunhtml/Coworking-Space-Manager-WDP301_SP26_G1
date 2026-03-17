import { Badge, Button, Dropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";

const DEFAULT_ROLE_LABELS = {
  Admin: { label: "Quản trị", icon: "bi-shield-lock-fill", color: "#ffc107" },
  Staff: { label: "Nhân viên", icon: "bi-briefcase-fill", color: "#4dabf7" },
  Customer: { label: "Tài khoản", icon: "bi-person-circle", color: "#74c0fc" },
};

function getDashboardPath(role) {
  if (role === "Admin") return "/admin";
  if (role === "Staff" || role === "Customer") return "/dashboard";
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
    <div className="d-flex gap-2 ms-lg-3 mt-2 mt-lg-0">
      {isAuthenticated && user ? (
        <Dropdown align="end">
          <Dropdown.Toggle
            variant="outline-secondary"
            className="px-3 rounded-0 fw-medium text-light border-secondary d-flex align-items-center gap-2"
            style={{ backgroundColor: "transparent" }}
          >
            <i className={`bi ${roleMeta.icon ?? "bi-person-circle"}`} style={{ color: roleMeta.color ?? "#aaa" }}></i>
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
          <Dropdown.Menu className="bg-dark border-secondary" style={{ minWidth: "180px" }}>
            {dashboardPath && (
              <Dropdown.Item as={Link} to={dashboardPath} className="text-light">
                <i className="bi bi-speedometer2 me-2"></i>
                {role === "Admin" ? "Quản trị" : "Dashboard"}
              </Dropdown.Item>
            )}
            <Dropdown.Divider className="border-secondary" />
            <Dropdown.Item onClick={handleLogout} className="text-danger">
              <i className="bi bi-box-arrow-right me-2"></i>Đăng xuất
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      ) : (
        <Button
          as={Link}
          to="/login"
          variant="outline-secondary"
          className="px-4 rounded-0 fw-medium text-uppercase text-light border-secondary"
        >
          {loginText}
        </Button>
      )}
    </div>
  );
}