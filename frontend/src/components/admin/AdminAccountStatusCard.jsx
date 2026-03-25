import { Badge, Card } from "react-bootstrap";

export default function AdminAccountStatusCard({ statusInfo, formatDate, profile }) {
  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Header className="bg-white border-0 pb-0">
        <h5 className="mb-0 fw-semibold">
          <i className="bi bi-shield-check text-primary me-2"></i>
          Thong tin tai khoan
        </h5>
      </Card.Header>
      <Card.Body className="pt-4">
        <div className="mb-4">
          <label className="form-label fw-semibold text-muted small">TRANG THAI TAI KHOAN</label>
          <p className="mb-0">
            <Badge bg={statusInfo.bg} className="px-3 py-2 fs-6">{statusInfo.label}</Badge>
          </p>
        </div>

        <div className="mb-4">
          <label className="form-label fw-semibold text-muted small">NGAY TAO TAI KHOAN</label>
          <p className="mb-0 fw-medium"><i className="bi bi-calendar-date me-2 text-muted"></i>{formatDate(profile.createdAt)}</p>
        </div>

      </Card.Body>
    </Card>
  );
}
