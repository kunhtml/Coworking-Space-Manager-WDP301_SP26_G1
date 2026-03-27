import { Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getDefaultDashboardByRole = (role) => {
    if (role === "Admin") return "/admin-dashboard/users";
    if (role === "Staff") return "/staff-dashboard";
    return "/customer-dashboard/orders";
  };

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (
    location.pathname.startsWith("/admin-dashboard") &&
    user.role !== "Admin"
  ) {
    return <Navigate to={getDefaultDashboardByRole(user.role)} replace />;
  }

  if (
    location.pathname.startsWith("/staff-dashboard") &&
    user.role !== "Staff"
  ) {
    return <Navigate to={getDefaultDashboardByRole(user.role)} replace />;
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div
      className="admin-layout d-flex min-vh-100"
      style={{ backgroundColor: "#f8f9fa" }}
    >
      <AdminSidebar user={user} onLogout={handleLogout} />
      <div className="admin-main flex-grow-1 d-flex flex-column">
        <header
          className="admin-header border-bottom d-flex align-items-center justify-content-end px-5 py-3"
          style={{
            backgroundColor: "white",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
            zIndex: 900,
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2 ms-2">
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "#e9ecef",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i
                  className="bi bi-person-fill"
                  style={{ fontSize: "18px", color: "#6c757d" }}
                ></i>
              </div>
              <div style={{ fontSize: "13px" }}>
                <div style={{ fontWeight: "600", color: "#212529" }}>
                  {user?.fullName || "Admin"}
                </div>
                <div style={{ color: "#6c757d", fontSize: "12px" }}>
                  {user?.role}
                </div>
              </div>
            </div>

            <button
              className="btn btn-sm rounded-circle"
              style={{
                backgroundColor: "#f0f2f5",
                color: "#6c757d",
                width: "40px",
                height: "40px",
                border: "none",
                transition: "all 0.2s",
              }}
              onClick={handleLogout}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#e2e6eb";
                e.target.style.color = "#dc3545";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#f0f2f5";
                e.target.style.color = "#6c757d";
              }}
              title="Đăng xuất"
            >
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </header>

        <main className="admin-content flex-grow-1 p-5 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
