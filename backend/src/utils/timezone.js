export const VIETNAM_TIMEZONE = "Asia/Ho_Chi_Minh";
export const VIETNAM_UTC_OFFSET = "+07:00";

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

export function getVietnamDateRange(dateText) {
  const normalizedDate = String(dateText || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
    return null;
  }

  return {
    from: new Date(`${normalizedDate}T00:00:00.000${VIETNAM_UTC_OFFSET}`),
    to: new Date(`${normalizedDate}T23:59:59.999${VIETNAM_UTC_OFFSET}`),
  };
}

export function parseVietnamDateTime(dateText, timeText) {
  const time = String(timeText || "").trim();
  const date = String(dateText || "").trim();
  if (!time && !date) return null;

  if (time.includes("T")) {
    const hasZone = /([zZ]|[+-]\d{2}:\d{2})$/.test(time);
    const iso = hasZone ? time : `${time}${VIETNAM_UTC_OFFSET}`;
    const value = new Date(iso);
    return Number.isFinite(value.getTime()) ? value : null;
  }

  if (!date || !time) return null;
  const fullTime = /^\d{2}:\d{2}$/.test(time) ? `${time}:00` : time;
  const value = new Date(`${date}T${fullTime}${VIETNAM_UTC_OFFSET}`);
  return Number.isFinite(value.getTime()) ? value : null;
}

export function toVietnamISOString(baseDate = new Date()) {
  const value = baseDate instanceof Date ? baseDate : new Date(baseDate);
  if (!Number.isFinite(value.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  const hour = parts.find((p) => p.type === "hour")?.value;
  const minute = parts.find((p) => p.type === "minute")?.value;
  const second = parts.find((p) => p.type === "second")?.value;

  return `${year}-${month}-${day}T${hour}:${minute}:${second}${VIETNAM_UTC_OFFSET}`;
}
