import { Spinner } from "react-bootstrap";

export default function LoadingSpinner({ text = "Loading...", color = "#6366f1", className = "" }) {
  return (
    <div className={`text-center py-5 ${className}`.trim()}>
      <Spinner animation="border" style={{ color }} />
      <p className="mt-2 text-muted small fw-semibold mb-0">{text}</p>
    </div>
  );
}
