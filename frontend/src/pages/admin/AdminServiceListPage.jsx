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

}
