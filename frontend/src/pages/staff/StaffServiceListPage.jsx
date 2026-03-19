import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import { apiClient } from "../../services/api";

const STATUS_UI = {
  Available: { label: "Còn hàng", className: "text-success" },
  In_Stock: { label: "Còn hàng", className: "text-success" },
  Unavailable: { label: "Hết hàng", className: "text-danger" },
  OutOfStock: { label: "Tạm hết", className: "text-danger" },
};

function fmtPrice(value) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))}đ`;
}

function getStatus(item) {
  const availability = String(item?.availabilityStatus || "Available");
  const stock = Number(item?.stockQuantity || 0);
  if (availability === "Unavailable" || availability === "OutOfStock" || stock <= 0) {
    return "Unavailable";
  }
  return availability === "In_Stock" ? "In_Stock" : "Available";
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
        apiClient.get("/menu/categories"),
        apiClient.get("/menu/items"),
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
      const categoryId = String(item?.categoryId?._id || item?.categoryId || "");
      const status = getStatus(item);
      const byCategory = selectedCategory === "all" || categoryId === selectedCategory;
      const byStatus = selectedStatus === "all" || status === selectedStatus;
      const bySearch =
        !q ||
        String(item?.name || "").toLowerCase().includes(q) ||
        String(item?.description || "").toLowerCase().includes(q);
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

      <Row className="g-3 mb-3">
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
            <option value="Available">Còn hàng</option>
            <option value="In_Stock">Còn hàng (In_Stock)</option>
            <option value="Unavailable">Hết hàng</option>
          </Form.Select>
        </Col>

        <Col md={4}>
          <div className="staff-search-wrap">
            <i className="bi bi-search"></i>
            <input
              placeholder="Tìm dịch vụ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </Col>

        <Col md={2} className="d-grid">
          <button className="staff-secondary-btn" type="button" onClick={loadData}>
            Tải lại
          </button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : filteredServices.length === 0 ? (
        <Alert variant="secondary">Không có dịch vụ phù hợp bộ lọc.</Alert>
      ) : (
        <Row className="g-3">
          {filteredServices.map((service) => {
            const statusKey = getStatus(service);
            const statusUi = STATUS_UI[statusKey] || { label: statusKey, className: "text-secondary" };
            const categoryName = service?.categoryId?.name || "Không phân loại";

            return (
              <Col xl={3} lg={4} md={6} key={String(service._id)}>
                <Card className="border-0 shadow-sm staff-menu-card h-100">
                  <div className="p-3 d-flex justify-content-between align-items-center">
                    <Badge className="bg-primary-subtle text-primary border-0">{categoryName}</Badge>
                  </div>

                  <div className="staff-service-thumb">
                    <i className="bi bi-cup-hot"></i>
                  </div>

                  <Card.Body>
                    <h5 className="fw-bold mb-2">{service.name}</h5>
                    <div className="text-secondary fw-semibold mb-3">{service.description || "Không có mô tả"}</div>
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-primary fw-bold" style={{ fontSize: "1.5rem" }}>
                        {fmtPrice(service.price)}
                      </div>
                      <div className={`${statusUi.className} fw-semibold`}>
                        ● {statusUi.label}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </AdminLayout>
  );
}
