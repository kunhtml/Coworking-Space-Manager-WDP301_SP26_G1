export function formatDate(input) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}