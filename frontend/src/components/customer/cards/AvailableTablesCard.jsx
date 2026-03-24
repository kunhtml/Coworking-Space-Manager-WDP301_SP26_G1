import { Badge, Button, Card, Col, Row } from "react-bootstrap";

export default function AvailableTablesCard({
  availableTables,
  selectedTable,
  setSelectedTable,
  setShowConfirmModal,
}) {
  if (availableTables.length === 0) {
    return null;
  }

  return (
    <Card className="border-0 shadow-sm rounded-4">
      <Card.Header className="bg-transparent border-0 p-4">
        <h4 className="fw-bold mb-0">
          <i className="bi bi-3-circle-fill text-primary me-2"></i>
          Chọn chỗ ngồi ({availableTables.length} chỗ trống)
        </h4>
      </Card.Header>
      <Card.Body className="p-4 pt-0">
        <Row className="g-3">
          {availableTables.map((table) => (
            <Col key={table._id} md={6} lg={4}>
              <div
                className={`table-card p-3 rounded-3 border-2 ${selectedTable?._id === table._id ? "border-primary bg-primary bg-opacity-10" : "border-light bg-white"}`}
                style={{
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onClick={() => setSelectedTable(table)}
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="fw-bold mb-0">{table.name}</h6>
                  <Badge bg="success" className="small">
                    Trống
                  </Badge>
                </div>
                <p className="text-muted small mb-2">
                  {table.tableType?.name} • {table.capacity} chỗ
                </p>
                <p className="text-muted small mb-0">
                  <i className="bi bi-geo-alt me-1"></i>
                  {table.location || "Tầng trệt"}
                </p>
              </div>
            </Col>
          ))}
        </Row>

        {selectedTable ? (
          <div className="mt-4 text-center">
            <Button variant="success" size="lg" className="px-5" onClick={() => setShowConfirmModal(true)}>
              <i className="bi bi-calendar-check me-2"></i>
              Đặt chỗ ngay
            </Button>
          </div>
        ) : null}
      </Card.Body>
    </Card>
  );
}
