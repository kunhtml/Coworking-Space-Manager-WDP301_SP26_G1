import { Nav, Badge } from "react-bootstrap";
import { Link, useLocation } from "react-router";

export default function AdminSidebar({ user, onLogout }) {
  const location = useLocation();
  const dashboardPath =
    user?.role === "Admin" ? "/admin-dashboard" : "/staff-dashboard";
  const dashboardPrefix =
    user?.role === "Admin" ? "/admin-dashboard" : "/staff-dashboard";

  const isActive = (path) => {
    if (path === "/staff-dashboard" || path === "/admin-dashboard") {
      return [
        "/dashboard",
        "/admin",
        "/staff-dashboard",
        "/admin-dashboard",
      ].includes(location.pathname);
    }

    if (location.pathname.startsWith(path)) {
      return true;
    }

    if (path.startsWith("/staff-dashboard/")) {
      const adminPath = path.replace("/staff-dashboard/", "/admin-dashboard/");
      return location.pathname.startsWith(adminPath);
    }

    if (path.startsWith("/admin-dashboard/")) {
      const staffPath = path.replace("/admin-dashboard/", "/staff-dashboard/");
      return location.pathname.startsWith(staffPath);
    }

    return false;
  };

  const menuSections = [
    {
      title: "TỔNG QUAN",
      items: [{ path: dashboardPath, icon: "bi-grid", label: "Dashboard" }],
    },
    {
      title: "CHECK-IN / CHECK-OUT",
      items: [
        {
          path: `${dashboardPrefix}/checkin`,
          icon: "bi-clipboard-check",
          label: "Check-in đơn",
          badge: 3,
        },
      ],
    },
    {
      title: "QUẢN LÝ KHÔNG GIAN",
      items: [
        {
          path: `${dashboardPrefix}/tables`,
          icon: "bi-map",
          label: "Sơ đồ chỗ ngồi",
        },
      ],
    },
    {
      title: "ĐƠN HÀNG & DỊCH VỤ",
      items: [
        {
          path: `${dashboardPrefix}/orders`,
          icon: "bi-receipt",
          label: "Quản lý đơn hàng",
          badge: 5,
        },
        {
          path: `${dashboardPrefix}/create-service`,
          icon: "bi-plus-circle",
          label: "Tạo đơn dịch vụ",
        },
        {
          path: `${dashboardPrefix}/services`,
          icon: "bi-book",
          label: "Danh sách dịch vụ",
        },
      ],
    },
    {
      title: "TÀI KHOẢN",
      items: [
        {
          path: `${dashboardPrefix}/profile`,
          icon: "bi-person-circle",
          label: "Hồ sơ cá nhân",
        },
        {
          path: `${dashboardPrefix}/password`,
          icon: "bi-key-fill",
          label: "Đổi mật khẩu",
        },
      ],
    },
  ];

  return (
    <div className="admin-sidebar d-flex flex-column">
      {/* Logo */}
      <div className="sidebar-header px-3 py-4">
        <Link to="/" className="d-flex align-items-center text-decoration-none">
          <div className="logo-icon me-2">
            <i className="bi bi-cup-hot-fill text-warning fs-4"></i>
          </div>
          <div>
            <div className="text-white fw-bold">StudySpace</div>
            <small className="text-muted-light">CSMS • Staff Panel</small>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <Nav className="flex-column flex-grow-1 px-2 py-3 sidebar-nav">
        {menuSections.map((section, idx) => (
          <div key={idx} className="mb-3">
            <div className="sidebar-section-title px-3 mb-2">
              {section.title}
            </div>
            {section.items.map((item) => (
              <Nav.Link
                key={item.path}
                as={Link}
                to={item.path}
                className={`sidebar-item d-flex align-items-center px-3 py-2 rounded-2 mb-1 ${
                  isActive(item.path) ? "active" : ""
                }`}
              >
                <i className={`bi ${item.icon} me-3`}></i>
                <span className="flex-grow-1">{item.label}</span>
                {item.badge && (
                  <Badge bg="danger" pill className="ms-2">
                    {item.badge}
                  </Badge>
                )}
              </Nav.Link>
            ))}
          </div>
        ))}

        {/* Logout */}
        <div className="mt-auto px-2 mb-3">
          <Nav.Link
            onClick={onLogout}
            className="sidebar-item d-flex align-items-center px-3 py-2 rounded-2 text-danger-light"
            style={{ cursor: "pointer" }}
          >
            <i className="bi bi-box-arrow-right me-3"></i>
            <span>Đăng xuất</span>
          </Nav.Link>
        </div>
      </Nav>

      {/* User Profile */}
      <div className="sidebar-footer px-3 py-3 border-top border-secondary">
        <div className="d-flex align-items-center">
          <div className="user-avatar me-3">
            <div className="avatar-circle bg-primary text-white d-flex align-items-center justify-content-center rounded-circle fw-bold">
              {(user?.fullName || "NV")
                .split(" ")
                .slice(-2)
                .map((part) => part[0])
                .join("")
                .toUpperCase()}
            </div>
          </div>
          <div className="flex-grow-1 overflow-hidden">
            <div className="text-white fw-medium text-truncate">
              {user?.fullName || "Nhân viên"}
            </div>
            <small className="text-muted-light">
              {user?.role === "Admin" ? "Quản trị viên" : "Nhân viên quầy"}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
