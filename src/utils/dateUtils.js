/**
 * Utility functions for date manipulation, parsing, and formatting
 * Supports Shillong Teer Night results display and date comparisons.
 */

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Format any date input (YYYY-MM-DD string, Date object, or timestamp)
 * into standard display format: "05 October 2026"
 */
export function formatDisplayDate(input) {
  if (!input) return "";

  // If already formatted like "05 October 2026", return it directly
  if (typeof input === "string" && /^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/.test(input.trim())) {
    return input.trim();
  }

  // Handle Firestore Timestamp { seconds: number }
  if (input && typeof input.toDate === "function") {
    input = input.toDate();
  } else if (input && typeof input.seconds === "number") {
    input = new Date(input.seconds * 1000);
  }

  // Handle YYYY-MM-DD string
  if (typeof input === "string") {
    const parts = input.trim().split(/[-/]/);
    if (parts.length === 3) {
      // Assuming YYYY-MM-DD or DD-MM-YYYY
      if (parts[0].length === 4) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          const paddedDay = String(day).padStart(2, "0");
          const monthName = MONTH_NAMES[month] || "";
          return `${paddedDay} ${monthName} ${year}`;
        }
      }
    }
  }

  const d = new Date(input);
  if (isNaN(d.getTime())) {
    return String(input);
  }

  const day = String(d.getDate()).padStart(2, "0");
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Normalizes any date into a sortable ISO string (YYYY-MM-DD)
 */
export function toISODateString(input) {
  if (!input) return "";

  if (typeof input === "string") {
    const trimmed = input.trim();
    // If already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    // Try parsing "05 October 2026" or "5 October 2026"
    const match = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (match) {
      const day = parseInt(match[1], 10);
      const monthIdx = MONTH_NAMES.findIndex(
        (m) => m.toLowerCase() === match[2].toLowerCase()
      );
      const year = match[3];
      if (monthIdx !== -1) {
        return `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
    }
  }

  const d = new Date(input);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return String(input);
}

/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
export function getTodayISODate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Compares two date inputs descending (newest first).
 */
export function compareDatesDesc(a, b) {
  const isoA = toISODateString(a);
  const isoB = toISODateString(b);
  if (isoA > isoB) return -1;
  if (isoA < isoB) return 1;
  return 0;
}
