import BaseTable from "../../common/BaseTable";
import { ORDER_ITEM_COLUMNS } from "../configs/orderHistoryColumns";

export default function OrderItemsTable({ items, fmt }) {
  const rows = Array.isArray(items) ? items : [];

  return (
    <div className="table-responsive mb-3">
      <BaseTable
        columns={ORDER_ITEM_COLUMNS}
        data={rows}
        emptyText="Không có món"
        rowKey={(item) => item.id || item.menuItemId || item.menuName}
        renderCell={(col, item) => {
          if (col.key === "menuName") return item.menuName;
          if (col.key === "quantity") return item.quantity;
          if (col.key === "priceAtOrder") return `${fmt(item.priceAtOrder)}d`;
          if (col.key === "note") return item.note || "-";
          if (col.key === "lineTotal") return <span className="fw-semibold">{fmt(item.lineTotal)}d</span>;
          return null;
        }}
      />
    </div>
  );
}
