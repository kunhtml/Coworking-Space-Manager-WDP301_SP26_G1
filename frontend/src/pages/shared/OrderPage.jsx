import { useState, useEffect } from "react";
import { Container, Navbar, Row, Col, Badge, Spinner } from "react-bootstrap";
import { Link } from "react-router"; // Lưu ý: Nếu dùng react-router-dom bản mới, import từ "react-router-dom"

export function meta() {
  return [
    { title: "Thực đơn | Nexus Coffee" },
    {
      name: "description",
      content:
        "Khám phá thực đơn đa dạng với các loại cà phê nguyên chất, trà thanh mát và bánh ngọt hấp dẫn tại Nexus Coffee.",
    },
  ];
}

export default function Menu() {
  // --- STATE ---
  const [menuCategories, setMenuCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- CẤU HÌNH API ---
  // Sửa URL này lại cho khớp với cổng backend của bạn (thường là 5000 hoặc 8080)
  const API_BASE_URL = "http://localhost:5000/api"; 

  // --- FETCH DATA TỪ BACKEND ---
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setLoading(true);
        // Gọi song song 2 API lấy Categories và Items cho nhanh
        const [categoriesRes, itemsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/menu/categories`),
          fetch(`${API_BASE_URL}/menu/items`),
        ]);

        if (!categoriesRes.ok || !itemsRes.ok) {
          throw new Error("Lỗi khi tải dữ liệu từ máy chủ");
        }

        const categories = await categoriesRes.json();
        const items = await itemsRes.json();

        // Xử lý dữ liệu: Nhóm các item vào đúng category
        const groupedData = categories.map((cat) => {
          return {
            title: cat.name,
            items: items
              .filter((item) => {
                // Kiểm tra xem categoryId có khớp không (đề phòng backend trả về ObjectId popualte)
                const itemCatId = item.categoryId?._id || item.categoryId;
                return itemCatId === cat._id;
              })
              .map((item) => ({
                name: item.name,
                desc: item.description,
                // Định dạng tiền tệ VNĐ chuẩn xác
                price: new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(item.price),
                // Có thể logic Mới/Bán chạy thêm vào backend sau, tạm thời set false
                isNew: false, 
                isBestSeller: false,
              })),
          };
        }).filter(category => category.items.length > 0); // Chỉ giữ lại các danh mục có món ăn

        setMenuCategories(groupedData);
      } catch (err) {
        console.error(err);
        setError("Không thể tải thực đơn lúc này. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100 bg-dark text-light font-monospace">
      {/* NAVBAR */}
      <Navbar expand="lg" className="bg-dark border-bottom border-secondary sticky-top py-3" variant="dark">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold text-white fs-4 d-flex align-items-center">
            <i className="bi bi-cup-hot-fill me-2 fs-3"></i>
            NEXUS COFFEE
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0 shadow-none" />
          <Navbar.Collapse id="basic-navbar-nav">
            <div className="ms-auto d-flex flex-column flex-lg-row gap-4 align-items-lg-center mt-3 mt-lg-0">
              <Link to="/#spaces" className="text-decoration-none text-light fw-medium px-2 py-1 hover-primary transition-all text-uppercase">
                Không gian
              </Link>
              <Link to="/menu" className="text-decoration-none text-warning fw-bold px-2 py-1 hover-primary transition-all text-uppercase">
                Thực đơn
              </Link>
              <Link to="/#booking" className="text-decoration-none text-light fw-medium px-2 py-1 hover-primary transition-all text-uppercase">
                Hướng dẫn đặt bàn
              </Link>
              <div className="d-flex gap-2 ms-lg-3 mt-2 mt-lg-0">
                <Link to="/" className="btn btn-outline-light px-4 rounded-0 fw-medium text-uppercase">
                  Về trang chủ
                </Link>
              </div>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* HEADER */}
      <header className="py-5 bg-black border-bottom border-secondary text-center">
        <Container>
          <h1 className="display-4 fw-bold text-white text-uppercase mb-3">Thực Đơn</h1>
          <p className="lead text-secondary mx-auto" style={{ maxWidth: "600px" }}>
            Khám phá hương vị đặc trưng được pha chế từ những hạt cà phê tuyển chọn và nguyên liệu tươi ngon nhất.
          </p>
        </Container>
      </header>

      {/* MAIN CONTENT - HIỂN THỊ DỮ LIỆU */}
      <main className="py-5 flex-grow-1">
        <Container>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="warning" />
              <p className="mt-3 text-warning">Đang tải thực đơn...</p>
            </div>
          ) : error ? (
            <div className="text-center py-5">
              <p className="text-danger fs-5">{error}</p>
            </div>
          ) : menuCategories.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-secondary fs-5">Chưa có món ăn nào trong thực đơn.</p>
            </div>
          ) : (
            menuCategories.map((category, idx) => (
              <div key={idx} className="mb-5 pb-4 border-bottom border-secondary">
                <h2 className="text-warning text-uppercase fw-bold mb-4 d-flex align-items-center">
                  <span className="me-3">{category.title}</span>
                  <div className="flex-grow-1 bg-secondary" style={{ height: "1px", opacity: 0.3 }}></div>
                </h2>
                <Row className="g-4">
                  {category.items.map((item, itemIdx) => (
                    <Col md={6} lg={4} key={itemIdx}>
                      <div className="p-4 border border-secondary h-100 bg-black hover-bg-dark transition-all d-flex flex-column position-relative overflow-hidden">
                        {item.isNew && (
                          <Badge bg="danger" className="position-absolute top-0 end-0 m-2 rounded-0 text-uppercase">
                            Mới
                          </Badge>
                        )}
                        {item.isBestSeller && (
                          <Badge bg="warning" text="dark" className="position-absolute top-0 end-0 m-2 rounded-0 text-uppercase">
                            Bán chạy
                          </Badge>
                        )}
                        <div className="d-flex justify-content-between align-items-start mb-3 mt-2">
                          <h5 className="text-white text-uppercase mb-0 pe-3">{item.name}</h5>
                          <span className="text-warning fw-bold" style={{ whiteSpace: "nowrap" }}>
                            {item.price}
                          </span>
                        </div>
                        <p className="text-secondary mb-0 flex-grow-1 small">{item.desc}</p>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            ))
          )}
        </Container>
      </main>

      {/* FOOTER */}
      <footer className="bg-black text-secondary py-5 mt-auto border-top border-secondary">
        <Container>
          <Row className="gy-4 align-items-center">
            <Col md={4} className="text-center text-md-start">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start mb-3">
                <i className="bi bi-cup-hot-fill me-2 fs-4 text-white"></i>
                <span className="fw-bold text-white fs-5">NEXUS COFFEE</span>
              </div>
              <p className="small mb-0">© 2026 NEXUS COFFEE. ALL RIGHTS RESERVED.</p>
            </Col>
            <Col md={8} className="text-center text-md-end">
              <div className="d-flex gap-4 justify-content-center justify-content-md-end">
                <a href="#" className="text-secondary text-decoration-none hover-white transition-all text-uppercase small fw-bold">Facebook</a>
                <a href="#" className="text-secondary text-decoration-none hover-white transition-all text-uppercase small fw-bold">Instagram</a>
                <a href="#" className="text-secondary text-decoration-none hover-white transition-all text-uppercase small fw-bold">Tiktok</a>
              </div>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
}