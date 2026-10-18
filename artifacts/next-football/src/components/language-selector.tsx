import { Globe } from "lucide-react";
import { translate, useLanguage, type Language } from "@/i18n";
export function LanguageSelector() {
 const {language,preference,setLanguage}=useLanguage();
 return <label className="next-language-selector"><Globe className="h-4 w-4 shrink-0" aria-hidden="true"/><span className="sr-only">{translate("Language")}</span><select aria-label={translate("Language")} value={preference ?? "auto"} onChange={event=>setLanguage(event.target.value as Language | "auto")}>
  <option value="auto">{translate("Automatic")} ({language.toUpperCase()})</option>
  <option value="en">EN · English</option><option value="it">IT · Italiano</option><option value="pl">PL · Polski</option><option value="es">ES · Español</option><option value="de">DE · Deutsch</option>
 </select></label>;
}
