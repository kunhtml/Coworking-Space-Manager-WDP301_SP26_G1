import { Link } from "react-router";

export function meta() {
  return [
    { title: "Dang ky | Nexus Coffee" },
    { name: "description", content: "Dang ky tai khoan Nexus Coffee" },
  ];
}

export default function Register() {
  return (
    <main className="container py-5 font-monospace">
      <h1 className="h3 mb-3">Dang ky</h1>
      <p className="text-muted mb-4">
        Trang dang ky duoc tach thanh page rieng theo cau truc Presentation Layer.
      </p>
      <Link to="/login" className="btn btn-outline-secondary">
        Quay ve dang nhap
      </Link>
    </main>
  );
}