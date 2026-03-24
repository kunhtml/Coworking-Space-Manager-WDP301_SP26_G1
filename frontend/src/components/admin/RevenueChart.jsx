import { Card } from "react-bootstrap";
import BaseTable from "../common/BaseTable";

export default function RevenueChart({ title, columns, data, loading, emptyText = "Khong co du lieu", renderCell }) {
  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Header className="bg-white border-bottom">
        <h5 className="mb-0 fw-bold">{title}</h5>
      </Card.Header>
      <Card.Body className="p-0">
        <BaseTable
          columns={columns}
          data={loading ? [] : data}
          emptyText={loading ? "Dang tai..." : emptyText}
          renderCell={renderCell}
          rowKey={(row, index) => row._id || row.id || index}
        />
      </Card.Body>
    </Card>
  );
}
