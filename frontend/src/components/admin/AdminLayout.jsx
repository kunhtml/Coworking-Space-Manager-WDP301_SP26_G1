import { Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getDefaultDashboardByRole = (role) => {
    if (role === "Admin") return "/admin";
    if (role === "Staff") return "/staff";
    return "/customer";
  };

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (
    location.pathname.startsWith("/admin") &&
    user.role !== "Admin"
  ) {
    return <Navigate to={getDefaultDashboardByRole(user.role)} replace />;
  }

  if (
    location.pathname.startsWith("/staff") &&
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
          className="admin-header border-bottom d-flex align-items-center justify-content-between px-5 py-3"
          style={{
            backgroundColor: "white",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
            zIndex: 900,
          }}
        >
          <div className="d-flex align-items-center gap-2">
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
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#e2e6eb")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#f0f2f5")}
            >
              <i className="bi bi-search"></i>
            </button>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: "1px",
                height: "24px",
                backgroundColor: "#dee2e6",
              }}
            ></div>

            <button
              className="btn btn-sm rounded-circle position-relative"
              style={{
                backgroundColor: "#f0f2f5",
                color: "#6c757d",
                width: "40px",
                height: "40px",
                border: "none",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#e2e6eb")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#f0f2f5")}
            >
              <i className="bi bi-bell"></i>
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger"
                style={{
                  fontSize: "0.5rem",
                  padding: "2px 4px",
                }}
              >
                3
              </span>
            </button>

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
