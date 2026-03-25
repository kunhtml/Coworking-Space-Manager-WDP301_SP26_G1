import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Alert, Col, Form, Row, Spinner } from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import ServiceForm from "../../components/staff/ServiceForm";
import StaffServiceTable from "../../components/staff/StaffServiceTable";
import { apiClient } from "../../services/api";
import { createCounterOrder, getStaffTables } from "../../services/staffDashboardService";

function fmtPrice(value) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))}đ`;
}

function isServiceAvailable(item) {
  const availability = String(item?.availabilityStatus || "AVAILABLE").toUpperCase();
  const stock = Number(item?.stockQuantity || 0);
  if (["OUT_OF_STOCK", "UNAVAILABLE", "OUTOFSTOCK"].includes(availability)) return false;
  return stock > 0;
}

export default function StaffCreateServicePage() {
  const [searchParams] = useSearchParams();
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedTableId, setSelectedTableId] = useState(searchParams.get("tableId") || "");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [creatingOrder, setCreatingOrder] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [tableRows, categoryRows, itemRows] = await Promise.all([
        getStaffTables({}),
        apiClient.get("/menu/categories?admin=true"),
        apiClient.get("/menu/items"),
      ]);

      setTables(Array.isArray(tableRows) ? tableRows : []);
      setCategories(Array.isArray(categoryRows) ? categoryRows : []);
      setServices(Array.isArray(itemRows) ? itemRows : []);

      // Pre-select tableId from URL if available and not already set
      const urlTableId = searchParams.get("tableId");
      if (urlTableId && !selectedTableId) {
        setSelectedTableId(urlTableId);
      }
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu dịch vụ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const categoryId = String(service?.categoryId?._id || service?.categoryId || "");
      const byCategory = selectedCategory === "all" || categoryId === selectedCategory;
      return byCategory;
    });
  }, [services, selectedCategory]);

  const addToCart = (service) => {
    if (!isServiceAvailable(service)) return;
    setCart((prev) => {
      const idx = prev.findIndex((x) => String(x.menuItemId) === String(service._id));
      if (idx === -1) {
        return [
          ...prev,
          {
            menuItemId: String(service._id),
            name: service.name,
            price: Number(service.price || 0),
            quantity: 1,
            note: "",
          },
        ];
      }
      return prev.map((x, i) =>
        i === idx ? { ...x, quantity: Number(x.quantity || 0) + 1 } : x,
      );
    });
  };

  const updateCartItem = (menuItemId, patch) => {
    setCart((prev) =>
      prev
        .map((x) =>
          String(x.menuItemId) === String(menuItemId) ? { ...x, ...patch } : x,
        )
        .filter((x) => Number(x.quantity || 0) > 0),
    );
  };

  const removeCartItem = (menuItemId) => {
    setCart((prev) => prev.filter((x) => String(x.menuItemId) !== String(menuItemId)));
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );

  const submitCreateServiceOrder = async () => {
    setError("");
    setSuccess("");

    if (!selectedTableId) {
      setError("Vui lòng chọn chỗ ngồi trước khi tạo đơn dịch vụ.");
      return;
    }
    if (!cart.length) {
      setError("Vui lòng chọn ít nhất 1 dịch vụ.");
      return;
    }

    setCreatingOrder(true);
    try {
      const payload = {
        tableId: selectedTableId,
        items: cart.map((x) => ({
          menuItemId: x.menuItemId,
          quantity: Number(x.quantity || 0),
          note: x.note || "",
        })),
      };
      const res = await createCounterOrder(payload);
      setSuccess(res.message || "Tạo đơn dịch vụ thành công.");
      setCart([]);
      await loadData();
    } catch (err) {
      setError(err.message || "Tạo đơn dịch vụ thất bại.");
    } finally {
      setCreatingOrder(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Tạo đơn dịch vụ</h2>
        <p className="text-secondary fw-semibold small mb-0">
          Danh sách đồ uống, in ấn, thiết bị được tải từ MongoDB
        </p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="mb-3" style={{ maxWidth: "280px" }}>
        <Form.Select
          className="staff-filter-control"
          value={selectedTableId}
          onChange={(e) => setSelectedTableId(e.target.value)}
        >
          <option value="">-- Chọn chỗ ngồi --</option>
          {tables.map((table) => (
            <option key={String(table.id)} value={String(table.id)}>
              {table.name} ({table.tableType})
            </option>
          ))}
        </Form.Select>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          className={`staff-chip ${selectedCategory === "all" ? "active" : ""}`}
          onClick={() => setSelectedCategory("all")}
        >
          Tất cả
        </button>
        {categories.map((category) => (
          <button
            type="button"
            key={String(category._id)}
            className={`staff-chip ${selectedCategory === String(category._id) ? "active" : ""}`}
            onClick={() => setSelectedCategory(String(category._id))}
          >
            {category.name}
          </button>
        ))}
      </div>

      <Row className="g-3">
        <Col xl={9}>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <StaffServiceTable
              data={filteredServices}
              isServiceAvailable={isServiceAvailable}
              addToCart={addToCart}
              fmtPrice={fmtPrice}
            />
          )}
        </Col>

        <Col xl={3}>
          <ServiceForm
            cart={cart}
            updateCartItem={updateCartItem}
            removeCartItem={removeCartItem}
            totalAmount={totalAmount}
            fmtPrice={fmtPrice}
            creatingOrder={creatingOrder}
            onSubmit={submitCreateServiceOrder}
          />
        </Col>
      </Row>
    </AdminLayout>
  );
}
