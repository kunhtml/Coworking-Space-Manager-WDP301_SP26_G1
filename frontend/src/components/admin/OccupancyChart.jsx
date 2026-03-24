import { Card } from "react-bootstrap";

export default function OccupancyChart({ title, children }) {
  return (
    <Card className="border-0" style={{ backgroundColor: "white", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)", borderRadius: "12px" }}>
      <Card.Body className="p-4">
        {title ? <h5 className="fw-bold mb-3">{title}</h5> : null}
        {children}
      </Card.Body>
    </Card>
  );
}
