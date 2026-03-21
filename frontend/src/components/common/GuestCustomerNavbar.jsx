import { Container, Nav, Navbar } from "react-bootstrap";
import { Link } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import AuthNavActions from "./AuthNavActions";

const BASE_LINKS = [
  { key: "home", label: "Trang chủ", to: "/" },
  { key: "booking", label: "Đặt chỗ", to: "/order-table" },
  { key: "menu", label: "Thực đơn", to: "/menu" },
];

export default function GuestCustomerNavbar({ activeItem = "home" }) {
  const { user } = useAuth();
  const role = String(user?.role || "").toLowerCase();
  const isCustomer = role === "customer";

  const links = isCustomer
    ? [...BASE_LINKS, { key: "orders", label: "Đơn của tôi", to: "/customer-dashboard/orders" }]
    : BASE_LINKS;

  return (
    <Navbar bg="white" expand="lg" className="py-3 shadow-sm border-0">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold d-flex align-items-center">
          <div
            className="coworking-logo me-2 d-flex align-items-center justify-content-center rounded-3"
            style={{ background: "#6366f1", width: "40px", height: "40px" }}
          >
            <i className="bi bi-cup-hot-fill text-white"></i>
          </div>
          <span style={{ color: "#1f2937" }}>Coworking Space</span>
        </Navbar.Brand>

        <Navbar.Toggle />
        <Navbar.Collapse>
          <Nav className="me-auto ms-5">
            {links.map((item) => (
              <Nav.Link
                key={item.key}
                as={Link}
                to={item.to}
                className={`fw-medium px-3 ${activeItem === item.key ? "text-primary" : "text-muted"}`}
              >
                {item.label}
              </Nav.Link>
            ))}
          </Nav>

          <div className="d-flex gap-3 align-items-center">
            <AuthNavActions />
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}