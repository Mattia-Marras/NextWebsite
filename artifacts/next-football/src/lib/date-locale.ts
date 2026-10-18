import { it, pl, es, de } from "date-fns/locale";
import { getLanguage } from "@/i18n";
export function getDateLocale() {
 const language = getLanguage();
 return language === "en" ? undefined : { it, pl, es, de }[language];
}
