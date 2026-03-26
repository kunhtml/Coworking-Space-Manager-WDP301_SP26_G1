import { Badge, Button } from "react-bootstrap";
import BaseTable from "../common/BaseTable";

function normalizeMenuStatus(item) {
  const availability = String(item?.availabilityStatus || "").trim().toUpperCase();
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

export default function AdminServiceTable({ data = [], categories = [], statusMap, fmtPrice, onEdit, onDelete }) {
  const columns = [
    { key: "index", header: "#", className: "px-4 py-3" },
    { key: "name", header: "Ten mon", className: "px-4 py-3" },
    { key: "category", header: "Danh muc", className: "px-4 py-3" },
    { key: "price", header: "Gia", className: "px-4 py-3" },
    { key: "stockQuantity", header: "Ton kho", className: "px-4 py-3" },
    { key: "availabilityStatus", header: "Trang thai", className: "px-4 py-3" },
    { key: "actions", header: "Thao tac", className: "px-4 py-3 text-center" },
  ];

  return (
    <BaseTable
      columns={columns}
      data={data}
      emptyText="Khong tim thay mon phu hop"
      rowKey={(item) => item._id}
      renderCell={(col, item, idx) => {
        const statusInfo = statusMap[normalizeMenuStatus(item)] || { label: item.availabilityStatus, bg: "secondary" };
        const stock = item.stockQuantity ?? 0;
        const stockColor = stock === 0 ? "#ef4444" : stock < 5 ? "#f59e0b" : "#10b981";
        const catObj = categories.find((c) => c._id === (item.categoryId?._id || item.categoryId));
        const catHidden = catObj && catObj.isActive === false;

        if (col.key === "index") return <span className="text-muted small">{idx + 1}</span>;
        if (col.key === "name") {
          return (
            <>
              <div className="fw-semibold">{item.name}</div>
              {item.description ? <div className="text-muted" style={{ fontSize: 12, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</div> : null}
            </>
          );
        }
        if (col.key === "category") {
          return item.categoryId ? (
            <span>
              <Badge bg="light" text="dark" className="border">{item.categoryId.name || item.categoryId}</Badge>
              {catHidden ? <Badge bg="secondary" className="ms-1" style={{ fontSize: 10 }}>Danh muc an</Badge> : null}
            </span>
          ) : <span className="text-muted">-</span>;
        }
        if (col.key === "price") return <span className="fw-semibold text-primary">{fmtPrice(item.price)}</span>;
        if (col.key === "stockQuantity") return <span style={{ color: stockColor, fontWeight: 600 }}>{stock}</span>;
        if (col.key === "availabilityStatus") return <Badge bg={statusInfo.bg}>{statusInfo.label}</Badge>;
        if (col.key === "actions") {
          return (
            <div className="d-flex gap-2 justify-content-center">
              <Button variant="outline-primary" size="sm" onClick={() => onEdit(item)}>
                <i className="bi bi-pencil me-1"></i>Sua
              </Button>
              <Button variant="outline-danger" size="sm" onClick={() => onDelete(item)}>
                <i className="bi bi-trash me-1"></i>Xoa
              </Button>
            </div>
          );
        }
        return null;
      }}
    />
  );
}
