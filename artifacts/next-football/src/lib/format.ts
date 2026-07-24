import { format, parseISO } from "date-fns";

export function formatDate(dateString: string) {
  try {
    return format(parseISO(dateString), "MMM d, yyyy");
  } catch (e) {
    return dateString;
  }
}

export function formatTime(dateString: string) {
  try {
    return format(parseISO(dateString), "HH:mm");
  } catch (e) {
    return dateString;
  }
}

export function formatDateTime(dateString: string) {
  try {
    return format(parseISO(dateString), "MMM d, yyyy • HH:mm");
  } catch (e) {
    return dateString;
  }
}
