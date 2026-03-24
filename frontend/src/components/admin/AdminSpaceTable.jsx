import { Badge, Button } from "react-bootstrap";
import BaseTable from "../common/BaseTable";

export default function AdminSpaceTable({ data = [], getStatusInfo, formatPrice, onEdit, onDelete }) {
  const columns = [
    { key: "name", header: "Ten ban", className: "px-4 py-3" },
    { key: "capacity", header: "Suc chua", className: "px-4 py-3" },
    { key: "pricePerHour", header: "Gia/gio", className: "px-4 py-3" },
    { key: "location", header: "Vi tri", className: "px-4 py-3" },
    { key: "status", header: "Trang thai", className: "px-4 py-3" },
    { key: "actions", header: "Thao tac", className: "px-4 py-3 text-center" },
  ];

  return (
    <BaseTable
      columns={columns}
      data={data}
      emptyText="Chua co ban nao"
      rowKey={(row) => row._id}
      renderCell={(col, table) => {
        if (col.key === "name") return <span className="fw-medium">{table.name}</span>;
        if (col.key === "capacity") return `${table.capacity} nguoi`;
        if (col.key === "pricePerHour") return <span className="fw-bold text-primary">{formatPrice(table.pricePerHour)}/h</span>;
        if (col.key === "location") return <span className="text-muted">{table.location || "-"}</span>;
        if (col.key === "status") {
          const statusInfo = getStatusInfo(table.status);
          return <Badge bg={statusInfo.bg}>{statusInfo.label}</Badge>;
        }
        if (col.key === "actions") {
          return (
            <div className="d-flex gap-2 justify-content-center">
              <Button variant="outline-info" size="sm" onClick={() => onEdit(table)}>
                <i className="bi bi-pencil-square me-1"></i>Sua
              </Button>
              <Button variant="outline-danger" size="sm" onClick={() => onDelete(table)}>
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
