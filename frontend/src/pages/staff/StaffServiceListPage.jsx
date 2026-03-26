import { useEffect, useMemo, useState } from "react";
import { Alert, Col, Form, Row } from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import EmptyState from "../../components/common/EmptyState";
import FilterBar from "../../components/common/FilterBar";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SearchInput from "../../components/common/SearchInput";
import ServiceCard from "../../components/staff/ServiceCard";
import { apiClient } from "../../services/api";

const STATUS_UI = {
  AVAILABLE: { label: "Còn hàng", className: "text-success" },
  OUT_OF_STOCK: { label: "Tạm hết", className: "text-danger" },
  UNAVAILABLE: { label: "Hết hàng", className: "text-secondary" },
};

function fmtPrice(value) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))}đ`;
}

function normalizeMenuStatus(item) {
  const availability = String(item?.availabilityStatus || "AVAILABLE")
    .trim()
    .toUpperCase();
  const stock = Number(item?.stockQuantity || 0);

  if (["UNAVAILABLE", "DISCONTINUED"].includes(availability)) {
    return "UNAVAILABLE";
  }
  if (["OUT_OF_STOCK", "OUTOFSTOCK"].includes(availability)) {
    return "OUT_OF_STOCK";
  }
  if (["IN_STOCK", "AVAILABLE"].includes(availability)) {
    return stock > 0 ? "AVAILABLE" : "OUT_OF_STOCK";
  }

  return stock > 0 ? "AVAILABLE" : "OUT_OF_STOCK";
}

export default function StaffServiceListPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [categoryRows, itemRows] = await Promise.all([
        apiClient.get("/menu/categories?admin=true"),
        apiClient.get("/menu/items?admin=true"),
      ]);
      setCategories(Array.isArray(categoryRows) ? categoryRows : []);
      setItems(Array.isArray(itemRows) ? itemRows : []);
    } catch (err) {
      setError(err.message || "Không thể tải dịch vụ từ hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();

    return items.filter((item) => {
      const categoryId = String(
        item?.categoryId?._id || item?.categoryId || "",
      );
      const status = normalizeMenuStatus(item);
      const byCategory =
        selectedCategory === "all" || categoryId === selectedCategory;
      const byStatus = selectedStatus === "all" || status === selectedStatus;
      const bySearch =
        !q ||
        String(item?.name || "")
          .toLowerCase()
          .includes(q) ||
        String(item?.description || "")
          .toLowerCase()
          .includes(q);
      return byCategory && byStatus && bySearch;
    });
  }, [items, selectedCategory, selectedStatus, search]);

  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Danh sách dịch vụ & Thực đơn</h2>
        <p className="text-secondary fw-semibold small mb-0">
          Dữ liệu được tải trực tiếp từ MongoDB
        </p>
      </div>

      <FilterBar className="mb-3">
        <Col md={3}>
          <Form.Select
            className="staff-filter-control"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={String(c._id)} value={String(c._id)}>
                {c.name}
              </option>
            ))}
          </Form.Select>
        </Col>

        <Col md={3}>
          <Form.Select
            className="staff-filter-control"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="AVAILABLE">Còn hàng</option>
            <option value="OUT_OF_STOCK">Tạm hết</option>
            <option value="UNAVAILABLE">Hết hàng</option>
          </Form.Select>
        </Col>

        <Col md={4}>
          <SearchInput
            placeholder="Tìm dịch vụ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>

        <Col md={2} className="d-grid">
          <button
            className="staff-secondary-btn"
            type="button"
            onClick={loadData}
          >
            Tải lại
          </button>
        </Col>
      </FilterBar>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <LoadingSpinner text="Đang tải dịch vụ..." color="#6366f1" />
      ) : filteredServices.length === 0 ? (
        <EmptyState icon="🧾" title="Không có dịch vụ phù hợp bộ lọc." />
      ) : (
        <Row className="g-3">
          {filteredServices.map((service) => {
            const statusKey = normalizeMenuStatus(service);
            const statusUi = STATUS_UI[statusKey] || {
              label: statusKey,
              className: "text-secondary",
            };
            const categoryName = service?.categoryId?.name || "Không phân loại";

            return (
              <ServiceCard
                key={String(service._id)}
                service={service}
                categoryName={categoryName}
                statusUi={statusUi}
                fmtPrice={fmtPrice}
              />
            );
          })}
        </Row>
      )}
    </AdminLayout>
  );
}
