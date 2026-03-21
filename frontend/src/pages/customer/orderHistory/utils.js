export const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Number(n || 0));

export function formatDateTime(iso) {
  if (!iso) return "--";
  const d = new Date(iso);
  return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function durationFromRange(start, end) {
  if (!start || !end) return 1;
  const diff = (new Date(end) - new Date(start)) / (1000 * 60 * 60);
  return diff > 0 ? Number(diff.toFixed(1)) : 1;
}

export function toDateInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function toTimeInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function emptyOrderLine() {
  return { menuItemId: "", quantity: 1, note: "" };
}
