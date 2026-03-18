import { useState, useEffect } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Table,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useAuth } from "../../hooks/useAuth";
import { apiClient as api } from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";

export function meta() {
  return [
    { title: "Quản lý Không gian | Admin" },
    { name: "description", content: "Quản lý bàn và không gian làm việc" },
  ];
}

export default function TableManagementPage() {
  const { user } = useAuth();

  const [tables, setTables] = useState([]);
  const [tableTypes, setTableTypes] = useState([]);
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
    typeId: "",
    capacity: "",
    pricePerHour: "",
    location: "",
    description: "",
    status: "Available",
  });
  const [editingId, setEditingId] = useState(null);
  const [deletingTable, setDeletingTable] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tablesData, typesData] = await Promise.all([
        api.get("/tables"),
        api.get("/table-types"),
      ]);
      setTables(tablesData);
      setTableTypes(typesData);
    } catch (err) {
      setError(err.message || "Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      typeId: "",
      capacity: "",
      pricePerHour: "",
      location: "",
      description: "",
      status: "Available",
    });
    setEditingId(null);
  };

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

  const openEdit = (table) => {
    setFormData({
      name: table.name,
      typeId: table.typeId?._id || "",
      capacity: table.capacity || "",
      pricePerHour: table.pricePerHour || "",
      location: table.location || "",
      description: table.description || "",
      status: table.status || "Available",
    });
    setEditingId(table._id);
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

  const openDelete = (table) => {
    setDeletingTable(table);
    setShowDeleteModal(true);
  };

  const submitDelete = async () => {
    setError("");
    setSuccess("");
    try {
      await api.delete(`/tables/${deletingTable._id}`);
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

  const STATUS_MAP = {
    Available: { label: "Có sẵn", bg: "success" },
    Occupied: { label: "Đang sử dụng", bg: "warning" },
    Maintenance: { label: "Bảo trì", bg: "danger" },
    Reserved: { label: "Đã đặt", bg: "info" },
  };

  const getStatusInfo = (status) => {
    return STATUS_MAP[status] || { label: status, bg: "secondary" };
  };

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <Row className="mb-4 align-items-center">
          <Col>
            <h2 className="fw-bold mb-1">
              <i className="bi bi-building me-2 text-primary"></i>
              Quản lý Không gian
            </h2>
            <p className="text-muted mb-0">Danh sách bàn và phòng làm việc</p>
          </Col>
          <Col xs="auto">
            <Button
              variant="success"
              size="lg"
              className="rounded-pill shadow-sm"
              onClick={openAdd}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Thêm bàn mới
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

        {/* Statistics Cards */}
        <Row className="mb-4 g-3">
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted small mb-1">Tổng số bàn</p>
                    <h3 className="fw-bold mb-0">{tables.length}</h3>
                  </div>
                  <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-grid-3x3 fs-4 text-primary"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted small mb-1">Có sẵn</p>
                    <h3 className="fw-bold mb-0 text-success">
                      {tables.filter((t) => t.status === "Available").length}
                    </h3>
                  </div>
                  <div className="bg-success bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-check-circle fs-4 text-success"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted small mb-1">Đang sử dụng</p>
                    <h3 className="fw-bold mb-0 text-warning">
                      {tables.filter((t) => t.status === "Occupied").length}
                    </h3>
                  </div>
                  <div className="bg-warning bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-person-workspace fs-4 text-warning"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted small mb-1">Bảo trì</p>
                    <h3 className="fw-bold mb-0 text-danger">
                      {tables.filter((t) => t.status === "Maintenance").length}
                    </h3>
                  </div>
                  <div className="bg-danger bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-tools fs-4 text-danger"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Tables Table */}
        <Card className="shadow-sm border-0 rounded-3">
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
                    <th className="px-4 py-3">Giá/giờ</th>
                    <th className="px-4 py-3">Vị trí</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.map((table) => {
                    const statusInfo = getStatusInfo(table.status);
                    return (
                      <tr key={table._id}>
                        <td className="px-4 py-3 fw-medium">{table.name}</td>
                        <td className="px-4 py-3">
                          {table.typeId ? (
                            <Badge bg="secondary">{table.typeId.name}</Badge>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3">{table.capacity} người</td>
                        <td className="px-4 py-3 fw-bold text-primary">
                          {formatPrice(table.pricePerHour)}/h
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {table.location || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge bg={statusInfo.bg}>{statusInfo.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="outline-info"
                            size="sm"
                            className="me-2"
                            onClick={() => openEdit(table)}
                          >
                            <i className="bi bi-pencil-square me-1"></i>
                            Sửa
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => openDelete(table)}
                          >
                            <i className="bi bi-trash me-1"></i>
                            Xoá
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>

        {/* Add Modal */}
        <Modal
          show={showAddModal}
          onHide={() => setShowAddModal(false)}
          size="lg"
          centered
        >
          <Form onSubmit={submitAdd}>
            <Modal.Header closeButton>
              <Modal.Title>
                <i className="bi bi-plus-circle me-2 text-success"></i>
                Thêm bàn mới
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Tên bàn *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Loại bàn</Form.Label>
                    <Form.Select
                      value={formData.typeId}
                      onChange={(e) =>
                        setFormData({ ...formData, typeId: e.target.value })
                      }
                    >
                      <option value="">-- Chọn loại --</option>
                      {tableTypes.map((type) => (
                        <option key={type._id} value={type._id}>
                          {type.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Sức chứa *</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData({ ...formData, capacity: e.target.value })
                      }
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Giá/giờ *</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={formData.pricePerHour}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pricePerHour: e.target.value,
                        })
                      }
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Vị trí</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Mô tả</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowAddModal(false)}
              >
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
          size="lg"
          centered
        >
          <Form onSubmit={submitEdit}>
            <Modal.Header closeButton>
              <Modal.Title>
                <i className="bi bi-pencil-square me-2 text-info"></i>
                Chỉnh sửa bàn
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Tên bàn *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Loại bàn</Form.Label>
                    <Form.Select
                      value={formData.typeId}
                      onChange={(e) =>
                        setFormData({ ...formData, typeId: e.target.value })
                      }
                    >
                      <option value="">-- Chọn loại --</option>
                      {tableTypes.map((type) => (
                        <option key={type._id} value={type._id}>
                          {type.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Sức chứa *</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData({ ...formData, capacity: e.target.value })
                      }
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Giá/giờ *</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={formData.pricePerHour}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pricePerHour: e.target.value,
                        })
                      }
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Trạng thái</Form.Label>
                    <Form.Select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                    >
                      <option value="Available">Có sẵn</option>
                      <option value="Occupied">Đang sử dụng</option>
                      <option value="Maintenance">Bảo trì</option>
                      <option value="Reserved">Đã đặt</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Vị trí</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Mô tả</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowEditModal(false)}
              >
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
            Bạn chắc chắn muốn xoá bàn <strong>"{deletingTable?.name}"</strong>?
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Huỷ
            </Button>
            <Button variant="danger" onClick={submitDelete}>
              <i className="bi bi-trash me-1"></i>
              Xoá
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </AdminLayout>
  );
}
