import { Badge, Button } from "react-bootstrap";
import BaseTable from "../common/BaseTable";

export default function AdminUserTable({ data = [], roleMap, statusMap, onEdit, onToggleStatus }) {
  const columns = [
    { key: "index", header: "#", className: "px-4 py-3" },
    { key: "fullName", header: "Ho va ten", className: "px-4 py-3" },
    { key: "email", header: "Email", className: "px-4 py-3" },
    { key: "phone", header: "So dien thoai", className: "px-4 py-3" },
    { key: "role", header: "Vai tro", className: "px-4 py-3" },
    { key: "membershipStatus", header: "Trang thai", className: "px-4 py-3" },
    { key: "createdAt", header: "Ngay tao", className: "px-4 py-3" },
    { key: "actions", header: "Thao tac", className: "px-4 py-3 text-center" },
  ];

  return (
    <BaseTable
      columns={columns}
      data={data}
      emptyText="Khong co du lieu"
      rowKey={(u) => u._id}
      renderCell={(col, u, idx) => {
        const roleInfo = roleMap[u.role] || { label: u.role, bg: "secondary" };
        const statusKey = (u.membershipStatus || "").toLowerCase() === "suspended" ? "Suspended" : "Active";
        const statusInfo = statusMap[statusKey];
        const isSuspended = statusKey === "Suspended";

        if (col.key === "index") return <span className="text-muted small">{idx + 1}</span>;
        if (col.key === "fullName") {
          return (
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                style={{ width: 36, height: 36, backgroundColor: isSuspended ? "#ffc10720" : "#e9ecef", fontSize: 13, color: isSuspended ? "#856404" : "#495057", border: isSuspended ? "1px solid #ffc107" : "none" }}
              >
                {(u.fullName || u.email || "?").split(" ").slice(-1)[0]?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <div className="fw-medium">{u.fullName || "-"}</div>
                {isSuspended ? <small className="text-warning">Dang bi khoa</small> : null}
              </div>
            </div>
          );
        }
        if (col.key === "email") return <span className="text-muted">{u.email}</span>;
        if (col.key === "phone") return <span className="text-muted">{u.phone || "-"}</span>;
        if (col.key === "role") return <Badge bg={roleInfo.bg}>{roleInfo.label}</Badge>;
        if (col.key === "membershipStatus") return <Badge bg={statusInfo.bg}>{statusInfo.label}</Badge>;
        if (col.key === "createdAt") return <span className="text-muted small">{new Date(u.createdAt).toLocaleDateString("vi-VN")}</span>;
        if (col.key === "actions") {
          return (
            <div className="d-flex gap-2 justify-content-center flex-wrap">
              <Button variant="outline-primary" size="sm" onClick={() => onEdit(u)}>
                <i className="bi bi-pencil me-1"></i>Sua
              </Button>
              <Button
                variant={isSuspended ? "outline-success" : "outline-warning"}
                size="sm"
                onClick={() => onToggleStatus(u, isSuspended ? "unlock" : "lock")}
              >
                <i className={`bi ${isSuspended ? "bi-unlock" : "bi-lock"} me-1`}></i>
                {isSuspended ? "Mo khoa" : "Khoa"}
              </Button>
            </div>
          );
        }
        return null;
      }}
    />
  );
}
