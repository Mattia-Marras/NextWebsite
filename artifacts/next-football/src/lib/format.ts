import { format, parseISO } from "date-fns";

export function formatDate(dateString: string) {
  try {
    return format(parseISO(dateString), "MMM d, yyyy");
  } catch {
    return dateString;
  }
}

export function formatTime(dateString: string) {
  try {
    return format(parseISO(dateString), "HH:mm");
  } catch {
    return dateString;
  }
}

/**
 * A 12:00 kickoff is the internal placeholder used when the date is known
 * but the real kickoff time has not been announced.
 */
export function isMatchTimeTba(dateString: string) {
  try {
    return format(parseISO(dateString), "HH:mm") === "12:00";
  } catch {
    return false;
  }
}

export function formatDateTime(dateString: string) {
  try {
    const date = parseISO(dateString);
    return isMatchTimeTba(dateString)
      ? `${format(date, "MMM d, yyyy")} • Time TBA`
      : format(date, "MMM d, yyyy • HH:mm");
  } catch {
    return dateString;
  }
}
