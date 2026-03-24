import { Table } from "react-bootstrap";

export default function BaseTable({ columns = [], data = [], emptyText = "No data", renderCell, rowKey }) {
  return (
    <Table responsive hover className="mb-0 align-middle">
      <thead className="table-light">
        <tr>
          {columns.map((col) => (
            <th key={col.key || col.header} className={col.className || ""}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="text-center text-muted py-4">{emptyText}</td>
          </tr>
        ) : (
          data.map((row, index) => (
            <tr key={rowKey ? rowKey(row, index) : index}>
              {columns.map((col) => (
                <td key={col.key || col.header} className={col.cellClassName || ""}>
                  {renderCell ? renderCell(col, row, index) : row[col.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </Table>
  );
}
