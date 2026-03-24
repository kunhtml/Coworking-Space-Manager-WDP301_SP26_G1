import { Card } from "react-bootstrap";

export default function ProfileHeroCard({ initials, fullName, email }) {
  return (
    <Card className="border-0 shadow-sm overflow-hidden mb-4">
      <div
        style={{
          height: "100px",
          background: "linear-gradient(90deg, #6366f1 0%, #7c3aed 100%)",
        }}
      ></div>
      <Card.Body style={{ marginTop: "-42px" }}>
        <div
          className="rounded-circle bg-white border d-flex align-items-center justify-content-center fw-bold text-primary shadow-sm"
          style={{ width: "84px", height: "84px", fontSize: "40px" }}
        >
          {initials}
        </div>
        <h3 className="fw-bold mt-3 mb-1">{fullName || "Khách hàng"}</h3>
        <p className="text-secondary fw-semibold mb-3">{email || "Chưa có email"}</p>
      </Card.Body>
    </Card>
  );
}
