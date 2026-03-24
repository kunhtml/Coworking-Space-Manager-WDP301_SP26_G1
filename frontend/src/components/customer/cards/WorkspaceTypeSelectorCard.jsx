import { Badge, Card, Col, Row, Spinner } from "react-bootstrap";

export default function WorkspaceTypeSelectorCard({
  loadingTypes,
  workspaceTypes,
  selectedType,
  setSelectedType,
  formatPrice,
}) {
  return (
    <Card className="border-0 shadow-sm rounded-4 mb-4">
      <Card.Header className="bg-transparent border-0 p-4">
        <h4 className="fw-bold mb-0">
          <i className="bi bi-1-circle-fill text-primary me-2"></i>
          Chọn loại chỗ ngồi
        </h4>
      </Card.Header>
      <Card.Body className="p-4 pt-0">
        {loadingTypes ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <Row className="g-3">
            {workspaceTypes.map((type) => (
              <Col key={type.id} lg={6}>
                <div
                  className={`workspace-type-card p-3 rounded-3 border-2 h-100 ${selectedType === type.id ? "border-primary" : "border-light"}`}
                  style={{
                    backgroundColor: selectedType === type.id ? type.color : "white",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => setSelectedType(type.id)}
                >
                  <div className="d-flex align-items-start gap-3">
                    <div className="workspace-icon" style={{ fontSize: "2.5rem" }}>
                      <i className={type.icon}></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <h6 className="fw-bold mb-0">{type.title}</h6>
                        {type.popular ? (
                          <Badge bg="warning" className="px-2">
                            Phổ biến
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-muted small mb-2">{type.description}</p>
                      <div className="d-flex align-items-center gap-2 small text-muted mb-2">
                        <span>
                          <i className="bi bi-people me-1"></i>
                          {type.capacity}
                        </span>
                        {type.features.slice(0, 2).map((feature, idx) => (
                          <span key={idx}>
                            <i className="bi bi-check-circle me-1 text-success"></i>
                            {feature}
                          </span>
                        ))}
                      </div>
                      <div className="fw-bold text-primary">{formatPrice(type.price)}/giờ</div>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </Card.Body>
    </Card>
  );
}
