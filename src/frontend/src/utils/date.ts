export function formatDate(value: string | Date | null | undefined, fallback: string = '-') {
  if (!value) return fallback;
  let d: Date;
  if (value instanceof Date) {
    d = value;
  } else {
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return fallback;
    d = parsed;
  }
  // Accounting style DD.MM.YYYY (Swiss / EU)
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
} 