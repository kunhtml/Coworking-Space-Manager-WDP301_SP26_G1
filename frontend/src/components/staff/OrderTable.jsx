import { Table } from "react-bootstrap";
import ActionButtons from "./ActionButtons";
import StatusBadge from "./StatusBadge";

export default function OrderTable({
  orders,
  onEdit,
  onPay,
  onComplete,
  onViewInvoice,
  completing,
  fmtCur,
  toTime,
  toDate,
}) {
  return (
    <Table responsive className="mb-0 align-middle staff-table">
      <thead>
        <tr>
          <th>MÃ ĐƠN</th>
          <th>KHÁCH HÀNG</th>
          <th>BÀN</th>
          <th>MÓN</th>
          <th>TỔNG</th>
          <th>TRẠNG THÁI</th>
          <th>GIỜ / NGÀY</th>
          <th>THAO TÁC</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={String(order.id)}>
            <td>
              <span className="fw-bold" style={{ color: "#6366f1" }}>
                {order.orderCode}
              </span>
            </td>
            <td>
              <div className="fw-semibold" style={{ color: "#0f172a" }}>
                {order.customerName || "Khách lẻ"}
              </div>
              {order.customerPhone && (
                <div style={{ color: "#64748b", fontSize: "0.78rem" }}>
                  {order.customerPhone}
                </div>
              )}
            </td>
            <td className="fw-semibold">{order.tableName || "--"}</td>
            <td style={{ maxWidth: 200 }}>
              <div style={{ fontSize: "0.82rem", color: "#475569" }}>
                {(order.items || []).slice(0, 2).map((it) => (
                  <div key={it.menuItemId || it.menuName}>
                    {it.menuName}{" "}
                    <span className="text-muted">x{it.quantity}</span>
                  </div>
                ))}
                {(order.items || []).length > 2 && (
                  <div style={{ color: "#94a3b8" }}>
                    +{order.items.length - 2} món khác
                  </div>
                )}
                {!(order.items || []).length && "--"}
              </div>
            </td>
            <td>
              <span className="fw-bold" style={{ color: "#15803d" }}>
                {fmtCur(order.totalAmount)}
              </span>
            </td>
            <td>
              <StatusBadge status={order.status} />
            </td>
            <td style={{ fontSize: "0.82rem", color: "#64748b" }}>
              <div>{toTime(order.createdAt)}</div>
              <div>{toDate(order.createdAt)}</div>
            </td>
            <td>
              <ActionButtons
                order={order}
                onEdit={onEdit}
                onPay={onPay}
                onComplete={onComplete}
                onViewInvoice={onViewInvoice}
                completing={completing}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
