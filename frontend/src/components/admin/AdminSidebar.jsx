import { Nav, Badge } from "react-bootstrap";
import { Link, useLocation } from "react-router";

export default function AdminSidebar({ user, onLogout }) {
  const location = useLocation();
  const isAdmin = user?.role === "Admin";

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

  const adminMenuSections = [
    {
      title: "TỔNG QUAN",
      items: [
        { path: "/admin-dashboard", icon: "bi-grid", label: "Dashboard" },
      ],
    },
    {
      title: "QUẢN LÝ NGƯỜI DÙNG",
      items: [
        {
          path: "/admin-dashboard/users",
          icon: "bi-people-fill",
          label: "Quản lý Users",
          badge: 12,
        },
      ],
    },
    {
      title: "DỮ LIỆU HỆ THỐNG",
      items: [
        {
          path: "/admin-dashboard/services",
          icon: "bi-book",
          label: "Quản lý Dịch vụ",
        },
        {
          path: "/admin-dashboard/spaces",
          icon: "bi-building",
          label: "Quản lý Không gian",
        },
      ],
    },
    {
      title: "BÁO CÁO & THỐNG KÊ",
      items: [
        {
          path: "/admin-dashboard/revenue",
          icon: "bi-graph-up-arrow",
          label: "Báo cáo Doanh thu",
        },
      ],
    },
    {
      title: "TÀI KHOẢN",
      items: [
        {
          path: "/admin-dashboard/profile",
          icon: "bi-person-circle",
          label: "Hồ sơ cá nhân",
        },
      ],
    },
  ];

  const staffMenuSections = [
    {
      title: "TỔNG QUAN",
      items: [
        { path: "/staff-dashboard", icon: "bi-grid", label: "Dashboard" },
      ],
    },
    {
      title: "CHECK-IN / CHECK-OUT",
      items: [
        {
          path: "/staff-dashboard/checkin",
          icon: "bi-clipboard-check",
          label: "Check-in đơn",
        },
      ],
    },
    {
      title: "QUẢN LÝ KHÔNG GIAN",
      items: [
        {
          path: "/staff-dashboard/tables",
          icon: "bi-map",
          label: "Sơ đồ chỗ ngồi",
        },
      ],
    },
    {
      title: "ĐƠN HÀNG & DỊCH VỤ",
      items: [
        {
          path: "/staff-dashboard/orders",
          icon: "bi-receipt",
          label: "Quản lý đơn hàng",
          badge: 5,
        },
        {
          path: "/staff-dashboard/create-service",
          icon: "bi-plus-circle",
          label: "Tạo đơn dịch vụ",
        },
        {
          path: "/staff-dashboard/services",
          icon: "bi-book",
          label: "Danh sách dịch vụ",
        },
      ],
    },
    {
      title: "TÀI KHOẢN",
      items: [
        {
          path: "/staff-dashboard/profile",
          icon: "bi-person-circle",
          label: "Hồ sơ cá nhân",
        },
      ],
    },
  ];

  const menuSections = isAdmin ? adminMenuSections : staffMenuSections;

  return (
    <div
      className="admin-sidebar d-flex flex-column"
      style={{
        width: "280px",
        backgroundColor: "#1e293b",
        color: "white",
        transition: "box-shadow 0.3s ease",
        boxShadow: "2px 0 8px rgba(0, 0, 0, 0.12)",
      }}
    >
      {/* Logo */}
      <div className="sidebar-header px-4 py-5">
        <Link to="/" className="d-flex align-items-center text-decoration-none">
          <div
            className="logo-icon me-3 d-flex align-items-center justify-content-center rounded-lg"
            style={{
              width: "48px",
              height: "48px",
              backgroundColor: "#fbbf24",
              transition: "transform 0.2s",
            }}
          >
            <i
              className="bi bi-cup-hot-fill text-dark"
              style={{ fontSize: "24px" }}
            ></i>
          </div>
          <div>
            <div
              className="fw-bold lh-1"
              style={{ fontSize: "16px", color: "white" }}
            >
              Coworking Space
            </div>
            <small style={{ color: "#94a3b8", fontSize: "11px" }}>
              {isAdmin ? "Admin Panel" : "Staff Panel"}
            </small>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <Nav className="flex-column flex-grow-1 px-2 py-2 sidebar-nav">
        {menuSections.map((section, idx) => (
          <div key={idx} className="mb-4">
            <div
              className="sidebar-section-title px-4 mb-3"
              style={{
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "0.5px",
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              {section.title}
            </div>
            {section.items.map((item) => (
              <Nav.Link
                key={item.path}
                as={Link}
                to={item.path}
                className={`sidebar-item d-flex align-items-center px-4 py-3 rounded-lg mb-1`}
                style={{
                  color: isActive(item.path) ? "#fbbf24" : "#cbd5e1",
                  backgroundColor: isActive(item.path)
                    ? "rgba(251, 191, 36, 0.1)"
                    : "transparent",
                  transition: "all 0.2s ease",
                  borderLeft: isActive(item.path)
                    ? "3px solid #fbbf24"
                    : "3px solid transparent",
                  cursor: "pointer",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(203, 213, 225, 0.08)";
                    e.currentTarget.style.color = "#f1f5f9";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#cbd5e1";
                  }
                }}
              >
                <i
                  className={`bi ${item.icon}`}
                  style={{
                    marginRight: "12px",
                    fontSize: "16px",
                    color: isActive(item.path) ? "#fbbf24" : "inherit",
                  }}
                ></i>
                <span className="flex-grow-1" style={{ fontSize: "14px" }}>
                  {item.label}
                </span>
                {item.badge && (
                  <Badge
                    bg="danger"
                    pill
                    className="ms-2"
                    style={{ fontSize: "11px", padding: "2px 8px" }}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Nav.Link>
            ))}
          </div>
        ))}

        {/* Logout */}
        <div className="mt-auto px-2 mb-4">
          <Nav.Link
            onClick={onLogout}
            className="sidebar-item d-flex align-items-center px-4 py-3 rounded-lg"
            style={{
              color: "#cbd5e1",
              backgroundColor: "transparent",
              transition: "all 0.2s ease",
              cursor: "pointer",
              textDecoration: "none",
              borderLeft: "3px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
              e.currentTarget.style.color = "#fca5a5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#cbd5e1";
            }}
          >
            <i
              className="bi bi-box-arrow-right"
              style={{ marginRight: "12px", fontSize: "16px" }}
            ></i>
            <span style={{ fontSize: "14px" }}>Đăng xuất</span>
          </Nav.Link>
        </div>
      </Nav>

      {/* User Profile */}
      <div
        className="sidebar-footer px-4 py-4 border-top"
        style={{
          borderTopColor: "#334155",
        }}
      >
        <div className="d-flex align-items-center">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "#fbbf24",
              color: "#1e293b",
              marginRight: "12px",
              fontSize: "14px",
              flexShrink: 0,
            }}
          >
            {(user?.fullName || "NV")
              .split(" ")
              .slice(-2)
              .map((part) => part[0])
              .join("")
              .toUpperCase()}
          </div>
          <div className="flex-grow-1 overflow-hidden">
            <div
              className="fw-600 text-truncate"
              style={{ fontSize: "14px", color: "white" }}
            >
              {user?.fullName || (isAdmin ? "Admin Master" : "Nhân viên")}
            </div>
            <small style={{ color: "#64748b", fontSize: "12px" }}>
              {isAdmin ? "Quản trị viên" : "Nhân viên"}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}

