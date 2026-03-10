export function meta() {
  return [
    { title: "Ho so | Nexus Coffee" },
    { name: "description", content: "Thong tin ho so nguoi dung" },
  ];
}

export default function Profile() {
  return (
    <main className="container py-5">
      <h1 className="h3 mb-3">Ho so</h1>
      <p className="text-muted mb-0">
        Trang profile duoc tach rieng de dam bao page-level responsibility.
      </p>
    </main>
  );
}