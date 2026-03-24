import { Badge, Card, Col, Row } from "react-bootstrap";

export default function StaffServiceTable({ data, isServiceAvailable, addToCart, fmtPrice }) {
  return (
    <Row className="g-3">
      {data.map((service) => {
        const available = isServiceAvailable(service);
        return (
          <Col lg={4} md={6} key={String(service._id)}>
            <Card
              className="border-0 shadow-sm staff-service-card h-100"
              onClick={() => addToCart(service)}
              style={{ cursor: available ? "pointer" : "not-allowed", opacity: available ? 1 : 0.65 }}
            >
              <div className="staff-service-thumb">
                <i className="bi bi-cup-hot" />
              </div>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <h6 className="fw-bold mb-0">{service.name}</h6>
                  <Badge className="staff-price-badge">{fmtPrice(service.price)}</Badge>
                </div>
                <small className="text-secondary fw-semibold">{service.description || "Khong co mo ta"}</small>
                {!available && (
                  <div className="mt-2">
                    <Badge className="bg-danger-subtle text-danger border-0">Het hang</Badge>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
