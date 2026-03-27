export const VIETNAM_TIMEZONE = "Asia/Ho_Chi_Minh";

export function getVietnamDateString(baseDate = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(baseDate);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function buildVietnamDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;
  const dt = new Date(`${dateValue}T${timeValue}:00+07:00`);
  return Number.isFinite(dt.getTime()) ? dt : null;
}
