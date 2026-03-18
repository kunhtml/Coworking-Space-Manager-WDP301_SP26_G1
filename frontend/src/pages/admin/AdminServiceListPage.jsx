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

export default function AdminServiceListPage() {
  return (
    <AdminLayout>
      <div className="mb-5 pb-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h1
              className="fw-bold mb-2"
              style={{ fontSize: "28px", color: "#1e293b" }}
            >
              <i
                className="bi bi-cup-hot"
                style={{ color: "#3b82f6", marginRight: "8px" }}
              ></i>
              Quản lý dịch vụ & Thực đơn
            </h1>
            <p className="mb-0" style={{ fontSize: "15px", color: "#64748b" }}>
              Quản lý đồ uống, đồ ăn, dịch vụ in ấn và cho thuê thiết bị
            </p>
          </div>
          <button
            className="btn px-4"
            style={{
              backgroundColor: "#3b82f6",
              color: "white",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "14px",
              border: "none",
            }}
          >
            <i className="bi bi-plus-lg me-2"></i>
            Thêm dịch vụ mới
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="g-3 mb-5">
        <Col md={6} lg={3}>
          <Card
            className="border-0"
            style={{
              backgroundColor: "white",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
              borderRadius: "12px",
              height: "100%",
            }}
          >
            <Card.Body className="p-4 d-flex align-items-center">
              <div
                className="rounded-lg d-flex align-items-center justify-content-center"
                style={{
                  width: "56px",
                  height: "56px",
                  backgroundColor: "#eff6ff",
                  marginRight: "12px",
                  flexShrink: 0,
                }}
              >
                <i
                  className="bi bi-cup-hot"
                  style={{ fontSize: "24px", color: "#3b82f6" }}
                ></i>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    fontWeight: "600",
                  }}
                >
                  Tổng dịch vụ
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#1e293b",
                  }}
                >
                  12
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card
            className="border-0"
            style={{
              backgroundColor: "white",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
              borderRadius: "12px",
              height: "100%",
            }}
          >
            <Card.Body className="p-4 d-flex align-items-center">
              <div
                className="rounded-lg d-flex align-items-center justify-content-center"
                style={{
                  width: "56px",
                  height: "56px",
                  backgroundColor: "#fef3c7",
                  marginRight: "12px",
                  flexShrink: 0,
                }}
              >
                <i
                  className="bi bi-exclamation-triangle"
                  style={{ fontSize: "24px", color: "#f59e0b" }}
                ></i>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    fontWeight: "600",
                  }}
                >
                  Sắp hết hàng
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#1e293b",
                  }}
                >
                  2
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card
            className="border-0"
            style={{
              backgroundColor: "white",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
              borderRadius: "12px",
              height: "100%",
            }}
          >
            <Card.Body className="p-4 d-flex align-items-center">
              <div
                className="rounded-lg d-flex align-items-center justify-content-center"
                style={{
                  width: "56px",
                  height: "56px",
                  backgroundColor: "#fee2e2",
                  marginRight: "12px",
                  flexShrink: 0,
                }}
              >
                <i
                  className="bi bi-x-circle"
                  style={{ fontSize: "24px", color: "#ef4444" }}
                ></i>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    fontWeight: "600",
                  }}
                >
                  Hết hàng
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#1e293b",
                  }}
                >
                  1
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card
            className="border-0"
            style={{
              backgroundColor: "white",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
              borderRadius: "12px",
              height: "100%",
            }}
          >
            <Card.Body className="p-4 d-flex align-items-center">
              <div
                className="rounded-lg d-flex align-items-center justify-content-center"
                style={{
                  width: "56px",
                  height: "56px",
                  backgroundColor: "#ecfdf5",
                  marginRight: "12px",
                  flexShrink: 0,
                }}
              >
                <i
                  className="bi bi-check-circle"
                  style={{ fontSize: "24px", color: "#10b981" }}
                ></i>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    fontWeight: "600",
                  }}
                >
                  Còn hàng
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#1e293b",
                  }}
                >
                  11
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="g-3 mb-5">
        <Col md={4}>
          <Form.Select
            className="admin-filter-control"
            style={{
              borderColor: "#e2e8f0",
              borderRadius: "8px",
              fontSize: "14px",
              padding: "10px 12px",
              backgroundColor: "white",
              color: "#64748b",
            }}
          >
            <option>Tất cả danh mục</option>
            <option>Đồ uống</option>
            <option>Đồ ăn nhẹ</option>
            <option>In ấn</option>
            <option>Thiết bị</option>
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Select
            className="admin-filter-control"
            style={{
              borderColor: "#e2e8f0",
              borderRadius: "8px",
              fontSize: "14px",
              padding: "10px 12px",
              backgroundColor: "white",
              color: "#64748b",
            }}
          >
            <option>Tất cả trạng thái</option>
            <option>Còn hàng</option>
            <option>Sắp hết</option>
            <option>Hết hàng</option>
          </Form.Select>
        </Col>
        <Col md={4}>
          <div
            className="admin-search-wrap"
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <i
              className="bi bi-search"
              style={{
                position: "absolute",
                left: "12px",
                color: "#94a3b8",
              }}
            ></i>
            <input
              placeholder="Tìm kiếm dịch vụ..."
              style={{
                width: "100%",
                padding: "10px 12px 10px 40px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "14px",
                color: "#64748b",
              }}
            />
          </div>
        </Col>
      </Row>

      {/* Services Grid */}
      <Row className="g-4">
        {services.map((service, idx) => (
          <Col xl={3} lg={4} md={6} key={idx}>
            <Card
              className="border-0 h-100"
              style={{
                backgroundColor: "white",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                borderRadius: "12px",
                overflow: "hidden",
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 8px 16px rgba(0, 0, 0, 0.12)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 1px 3px rgba(0, 0, 0, 0.08)";
                e.currentTarget.style.transform = "none";
              }}
            >
              <div
                className="p-3 d-flex justify-content-between align-items-start"
                style={{
                  borderBottom: "1px solid #f1f5f9",
                  backgroundColor: "#f8fafc",
                }}
              >
                <Badge
                  className="fw-semibold"
                  style={{
                    backgroundColor: "#eff6ff",
                    color: "#3b82f6",
                    fontSize: "11px",
                    padding: "4px 10px",
                    border: "1px solid #dbeafe",
                  }}
                >
                  {service.category}
                </Badge>
                <div className="dropdown">
                  <button
                    className="btn btn-sm btn-link text-secondary p-0"
                    type="button"
                    data-bs-toggle="dropdown"
                    style={{ textDecoration: "none" }}
                  >
                    <i
                      className="bi bi-three-dots-vertical"
                      style={{ fontSize: "16px" }}
                    ></i>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <a
                        className="dropdown-item"
                        href="#edit"
                        style={{ fontSize: "13px" }}
                      >
                        <i className="bi bi-pencil me-2"></i>Chỉnh sửa
                      </a>
                    </li>
                    <li>
                      <a
                        className="dropdown-item text-danger"
                        href="#delete"
                        style={{ fontSize: "13px" }}
                      >
                        <i className="bi bi-trash me-2"></i>Xoá
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              <div
                className="d-flex justify-content-center align-items-center p-4"
                style={{
                  fontSize: "48px",
                  backgroundColor: "#f8fafc",
                  minHeight: "80px",
                }}
              >
                {service.emoji}
              </div>

              <Card.Body className="p-4">
                <h5
                  className="fw-bold mb-2"
                  style={{
                    fontSize: "16px",
                    color: "#1e293b",
                    lineHeight: "1.3",
                  }}
                >
                  {service.name}
                </h5>
                <div
                  className="text-secondary fw-normal small mb-4"
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    lineHeight: "1.4",
                  }}
                >
                  {service.desc}
                </div>

                <div
                  className="mb-4 pb-4"
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#94a3b8",
                      marginBottom: "4px",
                    }}
                  >
                    Giá
                  </div>
                  <div
                    className="fw-bold"
                    style={{ fontSize: "18px", color: "#3b82f6" }}
                  >
                    {service.price}
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#94a3b8",
                        marginBottom: "4px",
                      }}
                    >
                      Số lượng
                    </div>
                    <div
                      style={{
                        fontWeight: "700",
                        color: "#1e293b",
                        fontSize: "16px",
                      }}
                    >
                      {service.quantity}
                    </div>
                  </div>
                  <div
                    className="fw-semibold text-end"
                    style={{
                      fontSize: "12px",
                      color:
                        service.statusClass === "text-success"
                          ? "#10b981"
                          : "#ef4444",
                    }}
                  >
                    <div>
                      {service.statusClass === "text-success" ? "✓" : "✕"}{" "}
                      {service.status}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </AdminLayout>
  );
}
