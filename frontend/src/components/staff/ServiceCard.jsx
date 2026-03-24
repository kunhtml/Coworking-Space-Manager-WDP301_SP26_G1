import { Badge, Card, Col } from "react-bootstrap";

export default function ServiceCard({
  service,
  categoryName,
  statusUi,
  fmtPrice,
  onEdit,
  onDelete,
}) {
  return (
    <Col xl={3} lg={4} md={6} key={String(service._id)}>
      <Card className="border-0 shadow-sm staff-menu-card h-100">
        <div className="p-3 d-flex justify-content-between align-items-center">
          <Badge className="bg-primary-subtle text-primary border-0">{categoryName}</Badge>
        </div>

        <div className="staff-service-thumb">
          <i className="bi bi-cup-hot" />
        </div>

        <Card.Body>
          <h5 className="fw-bold mb-2">{service.name}</h5>
          <div className="text-secondary fw-semibold mb-3">{service.description || "Không có mô tả"}</div>
          <div className="d-flex justify-content-between align-items-center">
            <div className="text-primary fw-bold" style={{ fontSize: "1.5rem" }}>
              {fmtPrice(service.price)}
            </div>
            <div className={`${statusUi.className} fw-semibold`}>
              ● {statusUi.label}
            </div>
          </div>
          {(onEdit || onDelete) && (
            <div className="d-flex gap-2 mt-3">
              {onEdit && (
                <button className="staff-icon-btn" type="button" onClick={() => onEdit(service)} title="Chinh sua">
                  <i className="bi bi-pencil-square" />
                </button>
              )}
              {onDelete && (
                <button className="staff-icon-btn" type="button" onClick={() => onDelete(service)} title="Xoa">
                  <i className="bi bi-trash" />
                </button>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    </Col>
  );
}
