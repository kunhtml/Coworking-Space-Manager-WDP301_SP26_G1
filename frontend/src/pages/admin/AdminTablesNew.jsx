import { useState, useEffect } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Row,
  Alert,
  Modal,
  Table,
  Nav,
  Tab,
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
  useAuth();

  const [tab, setTab] = useState("tables");
  const [tables, setTables] = useState([]);
  const [tableTypes, setTableTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTableTypeModal, setShowTableTypeModal] = useState(false);
  const [showDeleteTableTypeModal, setShowDeleteTableTypeModal] =
    useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    tableTypeId: "",
    pricePerHour: "",
    description: "",
    status: "Available",
  });
  const [editingId, setEditingId] = useState(null);
  const [deletingTable, setDeletingTable] = useState(null);
  const [editingTableTypeId, setEditingTableTypeId] = useState(null);
  const [deletingTableType, setDeletingTableType] = useState(null);
  const [tableTypeSubmitting, setTableTypeSubmitting] = useState(false);

  const [tableTypeForm, setTableTypeForm] = useState({
    name: "",
    description: "",
    capacity: "1",
    isHidden: false,
  });

  // Validation error states
  const [priceError, setPriceError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tablesData, tableTypesData] = await Promise.all([
        api.get("/tables"),
        api.get("/table-types"),
      ]);
      setTables(tablesData);
      setTableTypes(Array.isArray(tableTypesData) ? tableTypesData : []);
    } catch (err) {
      setError(err.message || "Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      tableTypeId: "",
      pricePerHour: "",
      description: "",
      status: "Available",
    });
    setEditingId(null);
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
      const selectedType = tableTypes.find(
        (type) => (type._id || type.sourceId) === formData.tableTypeId,
      );
      await api.post("/tables", {
        ...formData,
        tableTypeId: selectedType?._id || selectedType?.sourceId || "",
      });
      setSuccess("Thêm bàn thành công!");
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (err) {
      setError(err.message || "Lỗi khi thêm bàn");
    }
  };

  const openEdit = (table) => {
    const normalizedTypeId =
      table.tableTypeId ||
      tableTypes.find((type) => type.name === table.tableType)?._id ||
      tableTypes.find((type) => type.name === table.tableType)?.sourceId ||
      "";

    setFormData({
      name: table.name,
      tableTypeId: normalizedTypeId,
      pricePerHour: table.pricePerHour || "",
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
      const selectedType = tableTypes.find(
        (type) => (type._id || type.sourceId) === formData.tableTypeId,
      );
      await api.put(`/tables/${editingId}`, {
        ...formData,
        tableTypeId: selectedType?._id || selectedType?.sourceId || "",
      });
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

  const resetTableTypeForm = () => {
    setTableTypeForm({
      name: "",
      description: "",
      capacity: "1",
      isHidden: false,
    });
    setEditingTableTypeId(null);
  };

  const openTableTypeModal = () => {
    resetTableTypeForm();
    setShowTableTypeModal(true);
  };

  const openEditTableType = (type) => {
    setTableTypeForm({
      name: type.name || "",
      description: type.description || "",
      capacity: String(type.capacity || 1),
      isHidden: Boolean(type.isHidden),
    });
    setEditingTableTypeId(type._id || type.sourceId);
    setShowTableTypeModal(true);
  };

  const submitTableType = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setTableTypeSubmitting(true);
    try {
      const payload = {
        name: tableTypeForm.name,
        description: tableTypeForm.description,
        capacity: Number(tableTypeForm.capacity || 1),
        isHidden: Boolean(tableTypeForm.isHidden),
      };

      if (editingTableTypeId) {
        await api.put(`/table-types/${editingTableTypeId}`, payload);
        setSuccess("Cập nhật loại bàn thành công!");
      } else {
        await api.post("/table-types", payload);
        setSuccess("Thêm loại bàn thành công!");
      }

      resetTableTypeForm();
      setShowTableTypeModal(false);
      const tableTypesData = await api.get("/table-types");
      setTableTypes(Array.isArray(tableTypesData) ? tableTypesData : []);
    } catch (err) {
      setError(err.message || "Lỗi khi lưu loại bàn");
    } finally {
      setTableTypeSubmitting(false);
    }
  };

  const openDeleteTableType = (type) => {
    setDeletingTableType(type);
    setShowDeleteTableTypeModal(true);
  };

  const submitDeleteTableType = async () => {
    if (!deletingTableType) return;
    setError("");
    setSuccess("");
    try {
      await api.delete(
        `/table-types/${deletingTableType._id || deletingTableType.sourceId}`,
      );
      setSuccess("Xoá loại bàn thành công!");
      setShowDeleteTableTypeModal(false);
      setDeletingTableType(null);
      resetTableTypeForm();
      const tableTypesData = await api.get("/table-types");
      setTableTypes(Array.isArray(tableTypesData) ? tableTypesData : []);
      const tablesData = await api.get("/tables");
      setTables(Array.isArray(tablesData) ? tablesData : []);
    } catch (err) {
      setError(err.message || "Lỗi khi xoá loại bàn");
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
            {tab === "tables" ? (
              <Button
                variant="success"
                size="lg"
                className="rounded-pill shadow-sm"
                onClick={openAdd}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Thêm bàn mới
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                className="rounded-pill shadow-sm"
                onClick={openTableTypeModal}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Thêm loại bàn
              </Button>
            )}
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
            <SummaryCard
              label="Tổng số bàn"
              value={tables.length}
              icon="bi-grid-3x3"
              color="primary"
            />
          </Col>
          <Col md={3}>
            <SummaryCard
              label="Có sẵn"
              value={tables.filter((t) => t.status === "Available").length}
              icon="bi-check-circle"
              color="success"
            />
          </Col>
          <Col md={3}>
            <SummaryCard
              label="Đang sử dụng"
              value={tables.filter((t) => t.status === "Occupied").length}
              icon="bi-person-workspace"
              color="warning"
            />
          </Col>
          <Col md={3}>
            <SummaryCard
              label="Bảo trì"
              value={tables.filter((t) => t.status === "Maintenance").length}
              icon="bi-tools"
              color="danger"
            />
          </Col>
        </Row>

        <Tab.Container
          activeKey={tab}
          onSelect={(nextTab) => setTab(nextTab || "tables")}
        >
          <Card className="shadow-sm border-0 rounded-3">
            <Card.Header className="bg-white border-0 px-4 pt-3 pb-0">
              <Nav variant="tabs" className="border-0">
                <Nav.Item>
                  <Nav.Link
                    eventKey="tables"
                    className="fw-semibold"
                    style={{ fontSize: 14 }}
                  >
                    <i className="bi bi-grid-3x3-gap me-2"></i>Danh sách bàn (
                    {tables.length})
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    eventKey="table-types"
                    className="fw-semibold"
                    style={{ fontSize: 14 }}
                  >
                    <i className="bi bi-tags me-2"></i>Loại bàn (
                    {tableTypes.length})
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Header>

            <Tab.Content>
              <Tab.Pane eventKey="tables">
                <Card.Body className="p-0">
                  {loading ? (
                    <LoadingSpinner text="Đang tải..." color="#0d6efd" />
                  ) : tables.length === 0 ? (
                    <div className="text-center py-4">
                      <EmptyState icon="🪑" title="Chưa có bàn nào." />
                      <Button variant="primary" onClick={openAdd}>
                        Thêm bàn đầu tiên
                      </Button>
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
              </Tab.Pane>

              <Tab.Pane eventKey="table-types">
                {loading ? (
                  <LoadingSpinner text="Đang tải loại bàn..." color="#0d6efd" />
                ) : (
                  <div className="table-responsive">
                    <Table className="mb-0 align-middle" hover>
                      <thead className="table-light">
                        <tr>
                          <th className="px-4 py-3">#</th>
                          <th className="px-4 py-3">Tên loại bàn</th>
                          <th className="px-4 py-3">Sức chứa mặc định</th>
                          <th className="px-4 py-3">Mô tả</th>
                          <th className="px-4 py-3 text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableTypes.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center py-4 text-muted"
                            >
                              Chưa có loại bàn nào
                            </td>
                          </tr>
                        ) : (
                          tableTypes.map((type, idx) => (
                            <tr key={type._id || type.sourceId}>
                              <td className="px-4 py-3 text-muted">
                                {idx + 1}
                              </td>
                              <td className="px-4 py-3 fw-medium">
                                {type.name}
                              </td>
                              <td className="px-4 py-3">
                                {type.capacity || 1}
                              </td>
                              <td className="px-4 py-3 text-muted">
                                {type.description || "-"}
                              </td>
                              <td className="px-4 py-3">
                                <div className="d-flex gap-2 justify-content-center">
                                  <Button
                                    size="sm"
                                    variant="outline-info"
                                    onClick={() => openEditTableType(type)}
                                  >
                                    <i className="bi bi-pencil-square me-1"></i>
                                    Sửa
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline-danger"
                                    onClick={() => openDeleteTableType(type)}
                                  >
                                    <i className="bi bi-trash me-1"></i>Xoá
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Tab.Pane>
            </Tab.Content>
          </Card>
        </Tab.Container>

        <SpaceFormModal
          show={showAddModal}
          onHide={() => setShowAddModal(false)}
          onSubmit={submitAdd}
          title="Thêm bàn mới"
          submitText="Thêm"
          formData={formData}
          setFormData={setFormData}
          priceError={priceError}
          setPriceError={setPriceError}
          tableTypes={tableTypes}
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
          priceError={priceError}
          setPriceError={setPriceError}
          tableTypes={tableTypes}
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

        <Modal
          show={showTableTypeModal}
          onHide={() => setShowTableTypeModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {editingTableTypeId ? "Chỉnh sửa loại bàn" : "Thêm loại bàn"}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={submitTableType}>
            <Modal.Body>
              <Row className="g-3">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Tên loại bàn *</Form.Label>
                    <Form.Control
                      type="text"
                      value={tableTypeForm.name}
                      onChange={(e) =>
                        setTableTypeForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Sức chứa mặc định *</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      step="1"
                      value={tableTypeForm.capacity}
                      onChange={(e) =>
                        setTableTypeForm((prev) => ({
                          ...prev,
                          capacity: e.target.value,
                        }))
                      }
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Check
                      type="switch"
                      id="table-type-hidden-switch"
                      label="Tạm ẩn loại bàn này"
                      checked={Boolean(tableTypeForm.isHidden)}
                      onChange={(e) =>
                        setTableTypeForm((prev) => ({
                          ...prev,
                          isHidden: e.target.checked,
                        }))
                      }
                    />
                    <Form.Text className="text-muted">
                      Khi bật, toàn bộ bàn thuộc loại này sẽ bị ẩn khỏi sơ đồ
                      chỗ ngồi ở trang đặt bàn.
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Mô tả</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={tableTypeForm.description}
                      onChange={(e) =>
                        setTableTypeForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setShowTableTypeModal(false);
                  resetTableTypeForm();
                }}
                disabled={tableTypeSubmitting}
              >
                Huỷ
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={tableTypeSubmitting}
              >
                {tableTypeSubmitting ? (
                  <Spinner size="sm" animation="border" className="me-1" />
                ) : null}
                {editingTableTypeId ? "Lưu loại bàn" : "Thêm loại bàn"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        <ConfirmDialog
          show={showDeleteTableTypeModal}
          onCancel={() => setShowDeleteTableTypeModal(false)}
          onConfirm={submitDeleteTableType}
          title="Xác nhận xoá"
          message={`Bạn chắc chắn muốn xoá loại bàn "${deletingTableType?.name || ""}"?`}
          confirmText="Xoá"
          cancelText="Huỷ"
        />
      </div>
    </AdminLayout>
  );
}
