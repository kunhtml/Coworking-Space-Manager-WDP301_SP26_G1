import { Badge, Table } from "react-bootstrap";

export default function RecentActivityTable({ activity, statusUi, fmtCur, toTime }) {
  if (!activity || activity.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <div style={{ fontSize: 40 }}>📦</div>
        <p className="fw-semibold mt-2 small">Chua co don hang nao</p>
      </div>
    );
  }

  return (
    <Table responsive className="mb-0 align-middle staff-table">
      <thead>
        <tr>
          <th>MA DON</th>
          <th>KHACH HANG</th>
          <th>BAN</th>
          <th>TONG</th>
          <th>TRANG THAI</th>
          <th>GIO</th>
        </tr>
      </thead>
      <tbody>
        {activity.map((item) => {
          const ui = statusUi[item.status] || {
            label: item.status,
            cls: "bg-secondary-subtle text-secondary",
            icon: "bi-question",
          };
          return (
            <tr key={String(item.orderId)}>
              <td>
                <span className="fw-bold" style={{ color: "#6366f1" }}>{item.orderCode}</span>
              </td>
              <td className="fw-semibold">{item.customerName}</td>
              <td className="fw-semibold">{item.tableName}</td>
              <td>
                <span className="fw-bold" style={{ color: "#15803d" }}>{fmtCur(item.totalAmount)}</span>
              </td>
              <td>
                <Badge className={`rounded-pill border-0 px-3 py-2 ${ui.cls}`}>
                  <i className={`bi ${ui.icon} me-1`} />{ui.label}
                </Badge>
              </td>
              <td className="text-secondary fw-semibold small">{toTime(item.createdAt)}</td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
