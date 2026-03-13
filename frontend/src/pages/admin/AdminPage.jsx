import { useState, useEffect } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Nav,
  Navbar,
  Row,
  Table,
  Alert,
  Spinner,
  Dropdown,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { apiClient as api } from "../../services/api";

export function meta() {
  return [
    { title: "Admin | Nexus Coffee" },
    { name: "description", content: "Quản lý menu Nexus Coffee" },
  ];
}

export default function AdminPage() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    description: "",
    price: "",
    stockQuantity: "",
    availabilityStatus: "Available",
  });
  const [editingId, setEditingId] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [items, cats] = await Promise.all([
        api.get("/menu/items"),
        api.get("/menu/categories"),
      ]);
      setMenuItems(items);
      setCategories(cats);
    } catch (err) {
      setError(err.message || "Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      categoryId: "",
      description: "",
      price: "",
      stockQuantity: "",
      availabilityStatus: "Available",
    });
    setEditingId(null);
  };

  // === ADD ===
  const openAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const submitAdd = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.post("/menu/items", formData);
      setSuccess("Thêm món thành công!");
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (err) {
      setError(err.message || "Lỗi khi thêm món");
    }
  };

  // === EDIT ===
  const openEdit = (item) => {
    setFormData({
      name: item.name,
      categoryId: item.categoryId?._id || "",
      description: item.description || "",
      price: item.price || "",
      stockQuantity: item.stockQuantity || "",
      availabilityStatus: item.availabilityStatus || "Available",
    });
    setEditingId(item._id);
    setShowEditModal(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.put(`/menu/items/${editingId}`, formData);
      setSuccess("Cập nhật món thành công!");
      setShowEditModal(false);
      resetForm();
      loadData();
    } catch (err) {
      setError(err.message || "Lỗi khi cập nhật món");
    }
  };

  // === DELETE ===
  const openDelete = (item) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  const submitDelete = async () => {
    setError("");
    setSuccess("");
    try {
      await api.delete(`/menu/items/${deletingItem._id}`);
      setSuccess("Xoá món thành công!");
      setShowDeleteModal(false);
      setDeletingItem(null);
      loadData();
    } catch (err) {
      setError(err.message || "Lỗi khi xoá món");
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold text-white">
            <i className="bi bi-cup-hot-fill me-2 text-warning"></i>
            NEXUS ADMIN
          </Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse>
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/admin" className="text-light">
                <i className="bi bi-list-ul me-1"></i>
                Quản lý Menu
              </Nav.Link>
              <Nav.Link as={Link} to="/admin/tables" className="text-light">
                <i className="bi bi-table me-1"></i>
                Quản lý Bàn
              </Nav.Link>
              <Nav.Link as={Link} to="/admin/users" className="text-light">
                <i className="bi bi-people me-1"></i>
                Quản lý User
              </Nav.Link>
              <Nav.Link as={Link} to="/admin/reports" className="text-light">
                <i className="bi bi-bar-chart-line me-1"></i>
                Report & Analytics
              </Nav.Link>
            </Nav>
            <div className="ms-auto d-flex align-items-center gap-3 mt-3 mt-lg-0">
              <Dropdown align="end">
                <Dropdown.Toggle
                  variant="outline-light"
                  size="sm"
                  className="d-flex align-items-center gap-2"
                >
                  <i className="bi bi-person-circle"></i>
                  <span>{user?.fullName || user?.email || "Admin"}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu className="shadow">
                  <Dropdown.Item as={Link} to="/admin/profile">
                    <i className="bi bi-person me-2"></i>
                    Hồ sơ
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout} className="text-danger">
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Đăng xuất
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main */}
      <Container className="py-5">
        <Row className="mb-4 align-items-center">
          <Col>
            <h2 className="fw-bold mb-1">
              <i className="bi bi-list-ul me-2 text-primary"></i>
              Quản lý Menu
            </h2>
            <p className="text-muted mb-0">Danh sách món ăn & thức uống</p>
          </Col>
          <Col xs="auto">
            <Button
              variant="success"
              size="lg"
              className="rounded-pill shadow-sm"
              onClick={openAdd}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Thêm món mới
            </Button>
          </Col>
        </Row>

        {/* Alerts */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess("")}>
            {success}
          </Alert>
        )}

        {/* Table */}
        <Card className="shadow-sm border-0 rounded-3">
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="text-muted mt-3 mb-0">Đang tải...</p>
              </div>
            ) : menuItems.length === 0 ? (
              <div className="text-center py-5">
                <i
                  className="bi bi-inbox text-muted"
                  style={{ fontSize: "3rem" }}
                ></i>
                <p className="text-muted mt-3 mb-2">Chưa có món nào.</p>
                <Button variant="primary" onClick={openAdd}>
                  Thêm món đầu tiên
                </Button>
              </div>
            ) : (
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-4 py-3">Tên món</th>
                    <th className="px-4 py-3">Danh mục</th>
                    <th className="px-4 py-3">Giá</th>
                    <th className="px-4 py-3">Tồn kho</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {menuItems.map((item) => (
                    <tr key={item._id}>
                      <td className="px-4 py-3 fw-medium">{item.name}</td>
                      <td className="px-4 py-3">
                        {item.categoryId ? (
                          <Badge bg="secondary">{item.categoryId.name}</Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 fw-bold text-primary">
                        {formatPrice(item.price)}
                      </td>
                      <td className="px-4 py-3">{item.stockQuantity || 0}</td>
                      <td className="px-4 py-3">
                        <Badge
                          bg={
                            item.availabilityStatus === "Available"
                              ? "success"
                              : "warning"
                          }
                        >
                          {item.availabilityStatus === "Available"
                            ? "Có sẵn"
                            : "Hết"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="me-2"
                          onClick={() => openEdit(item)}
                        >
                          <i className="bi bi-pencil-square me-1"></i>
                          Sửa
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => openDelete(item)}
                        >
                          <i className="bi bi-trash me-1"></i>
                          Xoá
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* Add Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Form onSubmit={submitAdd}>
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="bi bi-plus-circle me-2 text-success"></i>
              Thêm món mới
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Tên món *</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Danh mục</Form.Label>
                  <Form.Select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                  >
                    <option value="">-- Chọn --</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Giá *</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tồn kho</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stockQuantity: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Select
                    value={formData.availabilityStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        availabilityStatus: e.target.value,
                      })
                    }
                  >
                    <option value="Available">Có sẵn</option>
                    <option value="Out_of_Stock">Hết hàng</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Huỷ
            </Button>
            <Button variant="success" type="submit">
              <i className="bi bi-check-lg me-1"></i>
              Thêm
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
      >
        <Form onSubmit={submitEdit}>
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="bi bi-pencil-square me-2 text-info"></i>
              Chỉnh sửa món
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Tên món *</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Danh mục</Form.Label>
                  <Form.Select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                  >
                    <option value="">-- Chọn --</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Giá *</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tồn kho</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stockQuantity: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Select
                    value={formData.availabilityStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        availabilityStatus: e.target.value,
                      })
                    }
                  >
                    <option value="Available">Có sẵn</option>
                    <option value="Out_of_Stock">Hết hàng</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Huỷ
            </Button>
            <Button variant="info" type="submit">
              <i className="bi bi-check-lg me-1"></i>
              Lưu
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-exclamation-triangle text-danger me-2"></i>
            Xác nhận xoá
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn chắc chắn muốn xoá món <strong>"{deletingItem?.name}"</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Huỷ
          </Button>
          <Button variant="danger" onClick={submitDelete}>
            <i className="bi bi-trash me-1"></i>
            Xoá
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
