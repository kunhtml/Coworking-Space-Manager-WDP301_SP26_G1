import { useState, useEffect } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Form,
  Row,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useAuth } from "../../hooks/useAuth";
import { apiClient as api } from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminSpaceTable from "../../components/admin/AdminSpaceTable";
import SpaceFormModal from "../../components/admin/SpaceFormModal";
import SummaryCard from "../../components/admin/SummaryCard";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export function meta() {
  return [
    { title: "Quản lý Không gian | Admin" },
    { name: "description", content: "Quản lý bàn và không gian làm việc" },
  ];
}

export default function TableManagementPage() {
  const { user } = useAuth();

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
    capacity: "",
    pricePerHour: "",
    location: "",
    description: "",
    status: "Available",
  });
  const [editingId, setEditingId] = useState(null);
  const [deletingTable, setDeletingTable] = useState(null);

  // Validation error states
  const [capacityError, setCapacityError] = useState("");
  const [priceError, setPriceError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const tablesData = await api.get("/tables");
      setTables(tablesData);
    } catch (err) {
      setError(err.message || "Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      capacity: "",
      pricePerHour: "",
      location: "",
      description: "",
      status: "Available",
    });
    setEditingId(null);
    setCapacityError("");
    setPriceError("");
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
            <SummaryCard label="Tổng số bàn" value={tables.length} icon="bi-grid-3x3" color="primary" />
          </Col>
          <Col md={3}>
            <SummaryCard label="Có sẵn" value={tables.filter((t) => t.status === "Available").length} icon="bi-check-circle" color="success" />
          </Col>
          <Col md={3}>
            <SummaryCard label="Đang sử dụng" value={tables.filter((t) => t.status === "Occupied").length} icon="bi-person-workspace" color="warning" />
          </Col>
          <Col md={3}>
            <SummaryCard label="Bảo trì" value={tables.filter((t) => t.status === "Maintenance").length} icon="bi-tools" color="danger" />
          </Col>
        </Row>

        {/* Tables Table */}
        <Card className="shadow-sm border-0 rounded-3">
          <Card.Body className="p-0">
            {loading ? (
              <LoadingSpinner text="Đang tải..." color="#0d6efd" />
            ) : tables.length === 0 ? (
              <div className="text-center py-4">
                <EmptyState icon="🪑" title="Chưa có bàn nào." />
                <Button variant="primary" onClick={openAdd}>Thêm bàn đầu tiên</Button>
              </div>
            ) : (
              <AdminSpaceTable
                data={tables}
                getStatusInfo={getStatusInfo}
                formatPrice={formatPrice}
                onEdit={openEdit}
                onDelete={openDelete}
              />
            )}
          </Card.Body>
        </Card>

        <SpaceFormModal
          show={showAddModal}
          onHide={() => setShowAddModal(false)}
          onSubmit={submitAdd}
          title="Thêm bàn mới"
          submitText="Thêm"
          formData={formData}
          setFormData={setFormData}
          capacityError={capacityError}
          setCapacityError={setCapacityError}
          priceError={priceError}
          setPriceError={setPriceError}
          mode="add"
        />

        <SpaceFormModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          onSubmit={submitEdit}
          title="Chỉnh sửa bàn"
          submitText="Lưu"
          formData={formData}
          setFormData={setFormData}
          capacityError={capacityError}
          setCapacityError={setCapacityError}
          priceError={priceError}
          setPriceError={setPriceError}
          mode="edit"
        />

        <ConfirmDialog
          show={showDeleteModal}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={submitDelete}
          title="Xác nhận xoá"
          message={`Bạn chắc chắn muốn xoá bàn "${deletingTable?.name || ""}"?`}
          confirmText="Xoá"
          cancelText="Huỷ"
        />
      </div>
    </AdminLayout>
  );
}
