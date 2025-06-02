/**
 * Format a Date object as a time string (HH:mm:ss or HH:mm:ss.SSS).
 *
 * @param date {Date} - The date to format
 * @param showMilliseconds {boolean} - Whether to include milliseconds
 * @returns {string} The formatted time string
 *
 * Example usage:
 * const t = formatTime(new Date(), true);
 */
export function formatTime(date: Date, showMilliseconds = false) {
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`;
  return showMilliseconds ? `${time}.${pad(date.getMilliseconds(), 3)}` : time;
}

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Get an HTML string for a number with its ordinal suffix (e.g. 1st, 2nd).
 *
 * @param n {number} - The number
 * @returns {string} HTML string with ordinal
 *
 * Example usage:
 * const html = getOrdinalHtml(3);
 */
export function getOrdinalHtml(n: number) {
  const ordinal = getOrdinal(n);
  return `${n}<sup class="text-[0.6em] font-normal">${ordinal}</sup>`;
}

/**
 * Get the ordinal suffix for a number (e.g. "st", "nd", "rd", "th").
 *
 * @param n {number} - The number
 * @returns {string} The ordinal suffix
 *
 * Example usage:
 * const suffix = getOrdinal(21); // "st"
 */
export function getOrdinal(n: number) {
  if (n > 3 && n < 21) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export function formatDate(date: Date, includeYear = true) {
  const dayName = dayNames[date.getDay()];
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${getOrdinalHtml(day)} ${month}${
    includeYear ? ` ${year}` : ""
  }`;
}

export function formatSimpleDate(dateInput: Date | string) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const dayName = dayNames[date.getDay()];
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${getOrdinalHtml(day)} ${month} ${year}`;
}
