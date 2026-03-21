import { useState, useEffect, useCallback } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Form,
  InputGroup,
  Modal,
  Row,
  Table,
  Alert,
  Spinner,
  Nav,
  Tab,
} from "react-bootstrap";
import { apiClient as api } from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";

export function meta() {
  return [
    { title: "Quản lý Menu | Nexus Admin" },
    { name: "description", content: "Quản lý menu và danh mục Nexus Coworking" },
  ];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "Available", label: "Còn hàng", bg: "success" },
  { value: "Unavailable", label: "Hết hàng", bg: "danger" },
  { value: "OutOfStock", label: "Tạm hết", bg: "warning" },
];

const STATUS_MAP = Object.fromEntries(
  STATUS_OPTIONS.map((s) => [s.value, s])
);

const EMPTY_ITEM_FORM = {
  name: "",
  categoryId: "",
  description: "",
  price: "",
  stockQuantity: "",
  availabilityStatus: "Available",
};

const EMPTY_CAT_FORM = {
  name: "",
  description: "",
  isActive: true,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtPrice = (n) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n || 0);

export default function AdminServiceListPage() {
  // ─── Tab ──────────────────────────────────────────────────
  const [tab, setTab] = useState("items");

  // ─── Items state ──────────────────────────────────────────
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [searchItem, setSearchItem] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // ─── Categories state ─────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [catsLoading, setCatsLoading] = useState(false);

  // ─── Global feedback ──────────────────────────────────────
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ─── Item modals ──────────────────────────────────────────
  const [showItemAdd, setShowItemAdd] = useState(false);
  const [showItemEdit, setShowItemEdit] = useState(false);
  const [showItemDelete, setShowItemDelete] = useState(false);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM_FORM);
  const [editingItemId, setEditingItemId] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [itemFormLoading, setItemFormLoading] = useState(false);

  // ─── Category modals ──────────────────────────────────────
  const [showCatAdd, setShowCatAdd] = useState(false);
  const [showCatEdit, setShowCatEdit] = useState(false);
  const [showCatDelete, setShowCatDelete] = useState(false);
  const [catForm, setCatForm] = useState(EMPTY_CAT_FORM);
  const [editingCatId, setEditingCatId] = useState(null);
  const [deletingCat, setDeletingCat] = useState(null);
  const [catFormLoading, setCatFormLoading] = useState(false);

  // ─── Load data ────────────────────────────────────────────
  const loadCategories = useCallback(async () => {
    setCatsLoading(true);
    try {
      const data = await api.get("/menu/categories");
      setCategories(data);
    } catch (err) {
      setError(err.message || "Lỗi khi tải danh mục");
    } finally {
      setCatsLoading(false);
    }
  }, []);

  const loadItems = useCallback(async () => {
    setItemsLoading(true);
    try {
      const data = await api.get("/menu/items");
      setItems(data);
    } catch (err) {
      setError(err.message || "Lỗi khi tải danh sách món");
    } finally {
      setItemsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    loadItems();
  }, [loadCategories, loadItems]);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

  // ─── Filtered items ───────────────────────────────────────
  const filteredItems = items.filter((item) => {
    const matchSearch =
      !searchItem ||
      item.name?.toLowerCase().includes(searchItem.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchItem.toLowerCase());
    const matchCat =
      !filterCat ||
      (item.categoryId && item.categoryId._id === filterCat);
    const matchStatus =
      !filterStatus || item.availabilityStatus === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  // ─── Stats ────────────────────────────────────────────────
  const statsAvailable = items.filter(
    (i) => i.availabilityStatus === "Available"
  ).length;
  const statsUnavailable = items.filter(
    (i) => i.availabilityStatus === "Unavailable"
  ).length;
  const statsOutOfStock = items.filter(
    (i) => i.availabilityStatus === "OutOfStock"
  ).length;

  // ═══════════════════════════════════════════════════════════
  // MENU ITEM CRUD
  // ═══════════════════════════════════════════════════════════

  const openItemAdd = () => {
    setItemForm(EMPTY_ITEM_FORM);
    setEditingItemId(null);
    setShowItemAdd(true);
  };

  const openItemEdit = (item) => {
    setEditingItemId(item._id);
    setItemForm({
      name: item.name || "",
      categoryId: item.categoryId?._id || item.categoryId || "",
      description: item.description || "",
      price: item.price ?? "",
      stockQuantity: item.stockQuantity ?? "",
      availabilityStatus: item.availabilityStatus || "Available",
    });
    setShowItemEdit(true);
  };

  const openItemDelete = (item) => {
    setDeletingItem(item);
    setShowItemDelete(true);
  };

  const submitItemAdd = async (e) => {
    e.preventDefault();
    setError("");
    setItemFormLoading(true);
    try {
      const res = await api.post("/menu/items", {
        ...itemForm,
        price: Number(itemForm.price),
        stockQuantity: Number(itemForm.stockQuantity) || 0,
        categoryId: itemForm.categoryId || null,
      });
      showSuccess(res.message || "Thêm món thành công!");
      setShowItemAdd(false);
      loadItems();
    } catch (err) {
      setError(err.message || "Lỗi khi thêm món");
    } finally {
      setItemFormLoading(false);
    }
  };

  const submitItemEdit = async (e) => {
    e.preventDefault();
    setError("");
    setItemFormLoading(true);
    try {
      const res = await api.put(`/menu/items/${editingItemId}`, {
        ...itemForm,
        price: Number(itemForm.price),
        stockQuantity: Number(itemForm.stockQuantity) || 0,
        categoryId: itemForm.categoryId || null,
      });
      showSuccess(res.message || "Cập nhật món thành công!");
      setShowItemEdit(false);
      loadItems();
    } catch (err) {
      setError(err.message || "Lỗi khi cập nhật món");
    } finally {
      setItemFormLoading(false);
    }
  };

  const confirmItemDelete = async () => {
    if (!deletingItem) return;
    setError("");
    setItemFormLoading(true);
    try {
      const res = await api.delete(`/menu/items/${deletingItem._id}`);
      showSuccess(res.message || "Xóa món thành công!");
      setShowItemDelete(false);
      setDeletingItem(null);
      loadItems();
    } catch (err) {
      setError(err.message || "Lỗi khi xóa món");
      setShowItemDelete(false);
    } finally {
      setItemFormLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // CATEGORY CRUD
  // ═══════════════════════════════════════════════════════════

  const openCatAdd = () => {
    setCatForm(EMPTY_CAT_FORM);
    setEditingCatId(null);
    setShowCatAdd(true);
  };

  const openCatEdit = (cat) => {
    setEditingCatId(cat._id);
    setCatForm({
      name: cat.name || "",
      description: cat.description || "",
      isActive: cat.isActive !== false,
    });
    setShowCatEdit(true);
  };

  const openCatDelete = (cat) => {
    setDeletingCat(cat);
    setShowCatDelete(true);
  };

  const submitCatAdd = async (e) => {
    e.preventDefault();
    setError("");
    setCatFormLoading(true);
    try {
      const res = await api.post("/menu/categories", catForm);
      showSuccess(res.message || "Thêm danh mục thành công!");
      setShowCatAdd(false);
      loadCategories();
    } catch (err) {
      setError(err.message || "Lỗi khi thêm danh mục");
    } finally {
      setCatFormLoading(false);
    }
  };

  const submitCatEdit = async (e) => {
    e.preventDefault();
    setError("");
    setCatFormLoading(true);
    try {
      const res = await api.put(`/menu/categories/${editingCatId}`, catForm);
      showSuccess(res.message || "Cập nhật danh mục thành công!");
      setShowCatEdit(false);
      loadCategories();
    } catch (err) {
      setError(err.message || "Lỗi khi cập nhật danh mục");
    } finally {
      setCatFormLoading(false);
    }
  };

  const confirmCatDelete = async () => {
    if (!deletingCat) return;
    setError("");
    setCatFormLoading(true);
    try {
      const res = await api.delete(`/menu/categories/${deletingCat._id}`);
      showSuccess(res.message || "Xóa danh mục thành công!");
      setShowCatDelete(false);
      setDeletingCat(null);
      loadCategories();
    } catch (err) {
      setError(err.message || "Lỗi khi xóa danh mục");
      setShowCatDelete(false);
    } finally {
      setCatFormLoading(false);
    }
  };

  // ─── Item Form Component (reused for Add & Edit) ──────────
  const ItemFormBody = ({ inModal }) => (
    <Row className="g-3">
      {inModal && error && (
        <Col xs={12}>
          <Alert variant="danger" dismissible onClose={() => setError("")} className="py-2">
            {error}
          </Alert>
        </Col>
      )}
      <Col md={6}>
        <Form.Group>
          <Form.Label className="fw-semibold">
            Tên món <span className="text-danger">*</span>
          </Form.Label>
          <Form.Control
            type="text"
            placeholder="Ví dụ: Cà phê sữa đá"
            value={itemForm.name}
            onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
            required
          />
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group>
          <Form.Label className="fw-semibold">Danh mục</Form.Label>
          <Form.Select
            value={itemForm.categoryId}
            onChange={(e) =>
              setItemForm({ ...itemForm, categoryId: e.target.value })
            }
          >
            <option value="">-- Không có danh mục --</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>
      <Col md={12}>
        <Form.Group>
          <Form.Label className="fw-semibold">Mô tả</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="Mô tả ngắn về món..."
            value={itemForm.description}
            onChange={(e) =>
              setItemForm({ ...itemForm, description: e.target.value })
            }
          />
        </Form.Group>
      </Col>
      <Col md={4}>
        <Form.Group>
          <Form.Label className="fw-semibold">
            Giá (VNĐ) <span className="text-danger">*</span>
          </Form.Label>
          <InputGroup>
            <Form.Control
              type="number"
              min={0}
              placeholder="0"
              value={itemForm.price}
              onChange={(e) =>
                setItemForm({ ...itemForm, price: e.target.value })
              }
              required
            />
            <InputGroup.Text>₫</InputGroup.Text>
          </InputGroup>
        </Form.Group>
      </Col>
      <Col md={4}>
        <Form.Group>
          <Form.Label className="fw-semibold">Số lượng tồn kho</Form.Label>
          <Form.Control
            type="number"
            min={0}
            placeholder="0"
            value={itemForm.stockQuantity}
            onChange={(e) =>
              setItemForm({ ...itemForm, stockQuantity: e.target.value })
            }
          />
        </Form.Group>
      </Col>
      <Col md={4}>
        <Form.Group>
          <Form.Label className="fw-semibold">Trạng thái</Form.Label>
          <Form.Select
            value={itemForm.availabilityStatus}
            onChange={(e) =>
              setItemForm({ ...itemForm, availabilityStatus: e.target.value })
            }
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>
    </Row>
  );

  // ─── Category Form Component ──────────────────────────────
  const CatFormBody = () => (
    <Row className="g-3">
      {error && (
        <Col xs={12}>
          <Alert variant="danger" dismissible onClose={() => setError("")} className="py-2">
            {error}
          </Alert>
        </Col>
      )}
      <Col md={12}>
        <Form.Group>
          <Form.Label className="fw-semibold">
            Tên danh mục <span className="text-danger">*</span>
          </Form.Label>
          <Form.Control
            type="text"
            placeholder="Ví dụ: Đồ uống, Đồ ăn nhẹ..."
            value={catForm.name}
            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
            required
          />
        </Form.Group>
      </Col>
      <Col md={12}>
        <Form.Group>
          <Form.Label className="fw-semibold">Mô tả</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="Mô tả ngắn về danh mục..."
            value={catForm.description}
            onChange={(e) =>
              setCatForm({ ...catForm, description: e.target.value })
            }
          />
        </Form.Group>
      </Col>
      <Col md={12}>
        <Form.Check
          type="switch"
          id="cat-isActive"
          label="Danh mục đang hoạt động"
          checked={catForm.isActive}
          onChange={(e) =>
            setCatForm({ ...catForm, isActive: e.target.checked })
          }
        />
      </Col>
    </Row>
  );
  // ─── Render ───────────────────────────────────────────────
  return (
    <AdminLayout>
      {/* Header */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-cup-hot-fill me-2 text-warning"></i>
            Quản lý Menu
          </h2>
          <p className="text-muted mb-0">
            Quản lý món ăn, đồ uống và danh mục trong thực đơn
          </p>
        </Col>
        <Col xs="auto">
          {tab === "items" ? (
            <Button
              variant="warning"
              size="lg"
              className="rounded-pill shadow-sm text-white"
              onClick={openItemAdd}
            >
              <i className="bi bi-plus-circle-fill me-2"></i>
              Thêm món mới
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              className="rounded-pill shadow-sm"
              onClick={openCatAdd}
            >
              <i className="bi bi-plus-circle-fill me-2"></i>
              Thêm danh mục
            </Button>
          )}
        </Col>
      </Row>

      {/* Global Alerts */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess("")}>
          <i className="bi bi-check-circle-fill me-2"></i>
          {success}
        </Alert>
      )}

      {/* Stats Cards */}
      <Row className="mb-4 g-3">
        {[
          {
            label: "Tổng số món",
            value: items.length,
            icon: "bi-journal-text",
            color: "#3b82f6",
            bg: "#eff6ff",
          },
          {
            label: "Còn hàng",
            value: statsAvailable,
            icon: "bi-check-circle",
            color: "#10b981",
            bg: "#ecfdf5",
          },
          {
            label: "Tạm hết",
            value: statsOutOfStock,
            icon: "bi-exclamation-triangle",
            color: "#f59e0b",
            bg: "#fef3c7",
          },
          {
            label: "Hết hàng",
            value: statsUnavailable,
            icon: "bi-x-circle",
            color: "#ef4444",
            bg: "#fee2e2",
          },
          {
            label: "Danh mục",
            value: categories.length,
            icon: "bi-tags",
            color: "#8b5cf6",
            bg: "#f5f3ff",
          },
        ].map((s, i) => (
          <Col key={i} md={i < 4 ? 3 : 12} lg={i < 4 ? "auto" : "auto"}>
            <Card
              className="border-0 h-100"
              style={{
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                borderRadius: 12,
                minWidth: 160,
              }}
            >
              <Card.Body className="p-3 d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3"
                  style={{ width: 48, height: 48, backgroundColor: s.bg }}
                >
                  <i
                    className={`bi ${s.icon}`}
                    style={{ fontSize: 22, color: s.color }}
                  ></i>
                </div>
                <div>
                  <div
                    style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{ fontSize: 22, fontWeight: 700, color: "#1e293b" }}
                  >
                    {s.value}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Tabs */}
      <Tab.Container activeKey={tab} onSelect={setTab}>
        <Card className="shadow-sm border-0 rounded-3">
          <Card.Header className="bg-white border-0 px-4 pt-3 pb-0">
            <div className="d-flex justify-content-between align-items-center">
              <Nav variant="tabs" className="border-0">
                <Nav.Item>
                  <Nav.Link
                    eventKey="items"
                    className="fw-semibold"
                    style={{ fontSize: 14 }}
                  >
                    <i className="bi bi-list-ul me-2"></i>
                    Danh sách món ({items.length})
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    eventKey="categories"
                    className="fw-semibold"
                    style={{ fontSize: 14 }}
                  >
                    <i className="bi bi-tags me-2"></i>
                    Danh mục ({categories.length})
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </div>
          </Card.Header>

          <Tab.Content>
            {/* ─── TAB: MENU ITEMS ─────────────────────────── */}
            <Tab.Pane eventKey="items">
              {/* Filters */}
              <div className="px-4 py-3 border-bottom bg-light">
                <Row className="g-2 align-items-center">
                  <Col md={5}>
                    <InputGroup>
                      <InputGroup.Text className="bg-white border-end-0">
                        <i className="bi bi-search text-muted"></i>
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="Tìm theo tên, mô tả..."
                        value={searchItem}
                        onChange={(e) => setSearchItem(e.target.value)}
                        className="border-start-0 ps-0"
                      />
                      {searchItem && (
                        <Button
                          variant="outline-secondary"
                          onClick={() => setSearchItem("")}
                        >
                          <i className="bi bi-x"></i>
                        </Button>
                      )}
                    </InputGroup>
                  </Col>
                  <Col md={3}>
                    <Form.Select
                      value={filterCat}
                      onChange={(e) => setFilterCat(e.target.value)}
                    >
                      <option value="">Tất cả danh mục</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Form.Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="">Tất cả trạng thái</option>
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={1} className="text-end">
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        setSearchItem("");
                        setFilterCat("");
                        setFilterStatus("");
                      }}
                      title="Xóa bộ lọc"
                    >
                      <i className="bi bi-arrow-counterclockwise"></i>
                    </Button>
                  </Col>
                </Row>
              </div>

              {/* Table */}
              {itemsLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="warning" />
                  <p className="text-muted mt-3">Đang tải danh sách món...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-5">
                  <i
                    className="bi bi-inbox text-muted"
                    style={{ fontSize: "3rem" }}
                  ></i>
                  <p className="text-muted mt-3 mb-2">
                    {items.length === 0
                      ? "Chưa có món nào trong menu."
                      : "Không tìm thấy món phù hợp."}
                  </p>
                  <Button variant="warning" className="text-white" onClick={openItemAdd}>
                    Thêm món đầu tiên
                  </Button>
                </div>
              ) : (
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Tên món</th>
                      <th className="px-4 py-3">Danh mục</th>
                      <th className="px-4 py-3">Giá</th>
                      <th className="px-4 py-3">Tồn kho</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, idx) => {
                      const statusInfo = STATUS_MAP[item.availabilityStatus] || {
                        label: item.availabilityStatus,
                        bg: "secondary",
                      };
                      return (
                        <tr key={item._id}>
                          <td className="px-4 py-3 text-muted small">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div className="fw-semibold">{item.name}</div>
                            {item.description && (
                              <div
                                className="text-muted"
                                style={{
                                  fontSize: 12,
                                  maxWidth: 260,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {item.description}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {item.categoryId ? (
                              <Badge bg="light" text="dark" className="border">
                                {item.categoryId.name || item.categoryId}
                              </Badge>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 fw-semibold text-primary">
                            {fmtPrice(item.price)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              style={{
                                color:
                                  (item.stockQuantity || 0) === 0
                                    ? "#ef4444"
                                    : (item.stockQuantity || 0) < 5
                                      ? "#f59e0b"
                                      : "#10b981",
                                fontWeight: 600,
                              }}
                            >
                              {item.stockQuantity ?? 0}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge bg={statusInfo.bg} className="px-2 py-1">
                              {statusInfo.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="d-flex gap-2 justify-content-center">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => openItemEdit(item)}
                                title="Chỉnh sửa"
                              >
                                <i className="bi bi-pencil me-1"></i>
                                Sửa
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => openItemDelete(item)}
                                title="Xóa"
                              >
                                <i className="bi bi-trash me-1"></i>
                                Xóa
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </Tab.Pane>

            {/* ─── TAB: CATEGORIES ─────────────────────────── */}
            <Tab.Pane eventKey="categories">
              {catsLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="text-muted mt-3">Đang tải danh mục...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-5">
                  <i
                    className="bi bi-tags text-muted"
                    style={{ fontSize: "3rem" }}
                  ></i>
                  <p className="text-muted mt-3 mb-2">
                    Chưa có danh mục nào.
                  </p>
                  <Button variant="primary" onClick={openCatAdd}>
                    Thêm danh mục đầu tiên
                  </Button>
                </div>
              ) : (
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Tên danh mục</th>
                      <th className="px-4 py-3">Mô tả</th>
                      <th className="px-4 py-3">Số món</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat, idx) => {
                      const itemCount = items.filter(
                        (i) =>
                          i.categoryId?._id === cat._id ||
                          i.categoryId === cat._id
                      ).length;
                      return (
                        <tr key={cat._id}>
                          <td className="px-4 py-3 text-muted small">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 fw-semibold">{cat.name}</td>
                          <td className="px-4 py-3 text-muted">
                            {cat.description || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge bg="info" text="dark">
                              {itemCount} món
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              bg={cat.isActive !== false ? "success" : "secondary"}
                            >
                              {cat.isActive !== false
                                ? "Đang hoạt động"
                                : "Tạm ẩn"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="d-flex gap-2 justify-content-center">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => openCatEdit(cat)}
                              >
                                <i className="bi bi-pencil me-1"></i>
                                Sửa
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => openCatDelete(cat)}
                                disabled={itemCount > 0}
                                title={
                                  itemCount > 0
                                    ? "Không thể xóa danh mục đang có món"
                                    : "Xóa danh mục"
                                }
                              >
                                <i className="bi bi-trash me-1"></i>
                                Xóa
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </Tab.Pane>
          </Tab.Content>
        </Card>
      </Tab.Container>

      {/* ════════════════════════════════════════════════════════
          ITEM MODALS
      ════════════════════════════════════════════════════════ */}

      {/* Add Item */}
      <Modal
        show={showItemAdd}
        onHide={() => {
          setShowItemAdd(false);
          setError("");
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <i className="bi bi-plus-circle-fill me-2 text-warning"></i>
            Thêm món mới
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={submitItemAdd}>
          <Modal.Body className="px-4">
            <ItemFormBody inModal />
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button
              variant="outline-secondary"
              onClick={() => {
                setShowItemAdd(false);
                setError("");
              }}
              disabled={itemFormLoading}
            >
              Hủy
            </Button>
            <Button
              variant="warning"
              className="text-white"
              type="submit"
              disabled={itemFormLoading}
            >
              {itemFormLoading ? (
                <Spinner size="sm" animation="border" className="me-1" />
              ) : (
                <i className="bi bi-check-lg me-1"></i>
              )}
              Thêm món
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Item */}
      <Modal
        show={showItemEdit}
        onHide={() => {
          setShowItemEdit(false);
          setError("");
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <i className="bi bi-pencil-square me-2 text-primary"></i>
            Chỉnh sửa món
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={submitItemEdit}>
          <Modal.Body className="px-4">
            <ItemFormBody inModal />
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button
              variant="outline-secondary"
              onClick={() => {
                setShowItemEdit(false);
                setError("");
              }}
              disabled={itemFormLoading}
            >
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={itemFormLoading}>
              {itemFormLoading ? (
                <Spinner size="sm" animation="border" className="me-1" />
              ) : (
                <i className="bi bi-check-lg me-1"></i>
              )}
              Lưu thay đổi
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Item */}
      <Modal
        show={showItemDelete}
        onHide={() => {
          setShowItemDelete(false);
          setDeletingItem(null);
        }}
        centered
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold text-danger">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Xác nhận xóa món
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4">
          <p className="mb-2">
            Bạn có chắc chắn muốn xóa món{" "}
            <strong>{deletingItem?.name}</strong>?
          </p>
          <Alert variant="warning" className="mb-0 py-2">
            <i className="bi bi-exclamation-circle me-2"></i>
            Hành động này <strong>không thể hoàn tác</strong>.
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            onClick={() => {
              setShowItemDelete(false);
              setDeletingItem(null);
            }}
            disabled={itemFormLoading}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            onClick={confirmItemDelete}
            disabled={itemFormLoading}
          >
            {itemFormLoading ? (
              <Spinner size="sm" animation="border" className="me-1" />
            ) : (
              <i className="bi bi-trash-fill me-1"></i>
            )}
            Xóa món
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ════════════════════════════════════════════════════════
          CATEGORY MODALS
      ════════════════════════════════════════════════════════ */}

      {/* Add Category */}
      <Modal
        show={showCatAdd}
        onHide={() => {
          setShowCatAdd(false);
          setError("");
        }}
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <i className="bi bi-tags-fill me-2 text-primary"></i>
            Thêm danh mục mới
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={submitCatAdd}>
          <Modal.Body className="px-4">
            <CatFormBody />
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button
              variant="outline-secondary"
              onClick={() => {
                setShowCatAdd(false);
                setError("");
              }}
              disabled={catFormLoading}
            >
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={catFormLoading}>
              {catFormLoading ? (
                <Spinner size="sm" animation="border" className="me-1" />
              ) : (
                <i className="bi bi-check-lg me-1"></i>
              )}
              Thêm danh mục
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Category */}
      <Modal
        show={showCatEdit}
        onHide={() => {
          setShowCatEdit(false);
          setError("");
        }}
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <i className="bi bi-pencil-square me-2 text-primary"></i>
            Chỉnh sửa danh mục
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={submitCatEdit}>
          <Modal.Body className="px-4">
            <CatFormBody />
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button
              variant="outline-secondary"
              onClick={() => {
                setShowCatEdit(false);
                setError("");
              }}
              disabled={catFormLoading}
            >
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={catFormLoading}>
              {catFormLoading ? (
                <Spinner size="sm" animation="border" className="me-1" />
              ) : (
                <i className="bi bi-check-lg me-1"></i>
              )}
              Lưu thay đổi
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Category */}
      <Modal
        show={showCatDelete}
        onHide={() => {
          setShowCatDelete(false);
          setDeletingCat(null);
        }}
        centered
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold text-danger">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Xóa danh mục
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4">
          <p className="mb-2">
            Bạn có chắc chắn muốn xóa danh mục{" "}
            <strong>{deletingCat?.name}</strong>?
          </p>
          <Alert variant="warning" className="mb-0 py-2">
            <i className="bi bi-exclamation-circle me-2"></i>
            Chỉ có thể xóa danh mục <strong>không chứa món nào</strong>.
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            onClick={() => {
              setShowCatDelete(false);
              setDeletingCat(null);
            }}
            disabled={catFormLoading}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            onClick={confirmCatDelete}
            disabled={catFormLoading}
          >
            {catFormLoading ? (
              <Spinner size="sm" animation="border" className="me-1" />
            ) : (
              <i className="bi bi-trash-fill me-1"></i>
            )}
            Xóa danh mục
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
}
