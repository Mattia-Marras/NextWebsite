import { format as baseFormat, parseISO } from "date-fns";
import { getDateLocale } from "./date-locale";
import { getLanguage, translate } from "@/i18n";
function format(date: Parameters<typeof baseFormat>[0], pattern: string) {
 const language=getLanguage();
 return baseFormat(date,pattern,language === "en" ? undefined : {locale:getDateLocale()});
}

export function formatDate(dateString: string | null | undefined) {
  if (!dateString) return translate("Date TBA");
  try {
    return format(parseISO(dateString), "MMM d, yyyy");
  } catch {
    return dateString;
  }
}

export function formatTime(dateString: string | null | undefined) {
  if (!dateString) return translate("Time TBA");
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
export function isMatchTimeTba(dateString: string | null | undefined) {
  if (!dateString) return true;
  try {
    return format(parseISO(dateString), "HH:mm") === "12:00";
  } catch {
    return false;
  }
}

export function formatDateTime(dateString: string | null | undefined) {
  if (!dateString) return translate("Date TBA");
  try {
    const date = parseISO(dateString);
    return isMatchTimeTba(dateString)
      ? `${format(date, "MMM d, yyyy")} • ${translate("Time TBA")}`
      : format(date, "MMM d, yyyy • HH:mm");
  } catch {
    return dateString;
  }
}
