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
    { title: "Quản lý Bàn | Nexus Coffee" },
    { name: "description", content: "Quản lý bàn Nexus Coffee" },
  ];
}

export default function TableManagementPage() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const [tables, setTables] = useState([]);
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
    tableType: "",
    capacity: "",
    status: "Available",
    pricePerHour: "",
    pricePerDay: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [deletingTable, setDeletingTable] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.get("/tables");
      setTables(data);
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
      tableType: "",
      capacity: "",
      status: "Available",
      pricePerHour: "",
      pricePerDay: "",
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
      await api.post("/tables", formData);
      setSuccess("Thêm bàn thành công!");
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (err) {
      setError(err.message || "Lỗi khi thêm bàn");
    }
  };

  // === EDIT ===
  const openEdit = (table) => {
    setFormData({
      name: table.name,
      tableType: table.tableType,
      capacity: table.capacity || "",
      status: table.status || "Available",
      pricePerHour: table.pricePerHour || "",
      pricePerDay: table.pricePerDay || "",
    });
    setEditingId(table.sourceId);
    setShowEditModal(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.put(`/tables/${editingId}`, formData);
      setSuccess("Cập nhật bàn thành công!");
      setShowEditModal(false);
      resetForm();
      loadData();
    } catch (err) {
      setError(err.message || "Lỗi khi cập nhật bàn");
    }
  };

  // === DELETE ===
  const openDelete = (table) => {
    setDeletingTable(table);
    setShowDeleteModal(true);
  };

  const submitDelete = async () => {
    setError("");
    setSuccess("");
    try {
      await api.delete(`/tables/${deletingTable.sourceId}`);
      setSuccess("Xoá bàn thành công!");
      setShowDeleteModal(false);
      setDeletingTable(null);
      loadData();
    } catch (err) {
      setError(err.message || "Lỗi khi xoá bàn");
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  const getStatusBadge = (status) => {
    const variants = {
      Available: "success",
      Occupied: "warning",
      Maintenance: "danger",
    };
    return <Badge bg={variants[status] || "secondary"}>{status}</Badge>;
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
              <i className="bi bi-table me-2 text-primary"></i>
              Quản lý Bàn
            </h2>
            <p className="text-muted mb-0">Quản lý danh sách bàn của quán</p>
          </Col>
          <Col xs="auto">
            <Button variant="primary" onClick={openAdd}>
              <i className="bi bi-plus-circle me-2"></i>
              Thêm bàn mới
            </Button>
          </Col>
        </Row>

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

        <Card className="shadow-sm border-0">
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="text-muted mt-3 mb-0">Đang tải...</p>
              </div>
            ) : tables.length === 0 ? (
              <div className="text-center py-5">
                <i
                  className="bi bi-inbox text-muted"
                  style={{ fontSize: "3rem" }}
                ></i>
                <p className="text-muted mt-3 mb-2">Chưa có bàn nào.</p>
                <Button variant="primary" onClick={openAdd}>
                  Thêm bàn đầu tiên
                </Button>
              </div>
            ) : (
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-4 py-3">Tên bàn</th>
                    <th className="px-4 py-3">Loại</th>
                    <th className="px-4 py-3">Sức chứa</th>
                    <th className="px-4 py-3">Giá/Giờ</th>
                    <th className="px-4 py-3">Giá/Ngày</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-end">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.map((table) => (
                    <tr key={table.sourceId}>
                      <td className="px-4 py-3 fw-bold">{table.name}</td>
                      <td className="px-4 py-3">{table.tableType}</td>
                      <td className="px-4 py-3">{table.capacity} người</td>
                      <td className="px-4 py-3">
                        {formatPrice(table.pricePerHour)}
                      </td>
                      <td className="px-4 py-3">
                        {formatPrice(table.pricePerDay)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(table.status)}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => openEdit(table)}
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => openDelete(table)}
                        >
                          <i className="bi bi-trash"></i>
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
      <Modal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-plus-circle me-2 text-primary"></i>
            Thêm bàn mới
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={submitAdd}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Tên bàn <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="VD: Bàn 1, Phòng VIP A..."
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Loại bàn <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={formData.tableType}
                    onChange={(e) =>
                      setFormData({ ...formData, tableType: e.target.value })
                    }
                    required
                  >
                    <option value="">-- Chọn loại --</option>
                    <option value="Standard">Standard</option>
                    <option value="VIP">VIP</option>
                    <option value="Meeting Room">Meeting Room</option>
                    <option value="Private Booth">Private Booth</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Sức chứa <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    placeholder="Số người"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Giá/Giờ (đ)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.pricePerHour}
                    onChange={(e) =>
                      setFormData({ ...formData, pricePerHour: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Giá/Ngày (đ)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.pricePerDay}
                    onChange={(e) =>
                      setFormData({ ...formData, pricePerDay: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Trạng thái</Form.Label>
              <Form.Select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Maintenance">Maintenance</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              <i className="bi bi-check-circle me-2"></i>
              Thêm bàn
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-pencil me-2 text-warning"></i>
            Chỉnh sửa bàn
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={submitEdit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Tên bàn <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="VD: Bàn 1, Phòng VIP A..."
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Loại bàn <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={formData.tableType}
                    onChange={(e) =>
                      setFormData({ ...formData, tableType: e.target.value })
                    }
                    required
                  >
                    <option value="">-- Chọn loại --</option>
                    <option value="Standard">Standard</option>
                    <option value="VIP">VIP</option>
                    <option value="Meeting Room">Meeting Room</option>
                    <option value="Private Booth">Private Booth</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Sức chứa <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    placeholder="Số người"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Giá/Giờ (đ)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.pricePerHour}
                    onChange={(e) =>
                      setFormData({ ...formData, pricePerHour: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Giá/Ngày (đ)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.pricePerDay}
                    onChange={(e) =>
                      setFormData({ ...formData, pricePerDay: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Trạng thái</Form.Label>
              <Form.Select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Maintenance">Maintenance</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Hủy
            </Button>
            <Button variant="warning" type="submit">
              <i className="bi bi-check-circle me-2"></i>
              Cập nhật
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-exclamation-triangle me-2 text-danger"></i>
            Xác nhận xoá
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            Bạn có chắc chắn muốn xoá bàn <strong>{deletingTable?.name}</strong>
            ?
          </p>
          <p className="text-muted small mb-0 mt-2">
            <i className="bi bi-info-circle me-1"></i>
            Thao tác này không thể hoàn tác.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={submitDelete}>
            <i className="bi bi-trash me-2"></i>
            Xoá bàn
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
