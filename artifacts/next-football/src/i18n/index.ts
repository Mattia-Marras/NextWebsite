import { useSyncExternalStore } from "react";
import it from "./it.json";
import pl from "./pl.json";
import es from "./es.json";
import de from "./de.json";
export type Language = "en" | "it" | "pl" | "es" | "de";
export const LANGUAGE_STORAGE_KEY = "next.language";
const supported = new Set(["en", "it", "pl", "es", "de"]);
const normalize = (value: string | null | undefined): Language | null => {
 const base = value?.toLowerCase().split(/[-_]/)[0];
 return base && supported.has(base) ? base as Language : null;
};
export function detectLanguage(languages: readonly string[]): Language {
 for (const candidate of languages) { const language = normalize(candidate); if (language) return language; }
 return "en";
}
function savedPreference(): Language | null {
 if (typeof window === "undefined") return null;
 try { const stored=window.localStorage.getItem(LANGUAGE_STORAGE_KEY); return stored && supported.has(stored) ? stored as Language : null; } catch { return null; }
}
function browserLanguage(): Language {
 if (typeof navigator === "undefined") return "en";
 return detectLanguage(navigator.languages?.length ? navigator.languages : [navigator.language]);
}
let preference: Language | null = savedPreference();
let language: Language = preference ?? browserLanguage();
const listeners = new Set<() => void>();
function publish() {
 if (typeof document !== "undefined") document.documentElement.lang=language;
 for (const listener of listeners) listener();
}
export function setLanguage(next: Language | "auto") {
 if (next !== "auto" && !supported.has(next)) return;
 preference = next === "auto" ? null : next;
 language = preference ?? browserLanguage();
 try { if (preference) window.localStorage.setItem(LANGUAGE_STORAGE_KEY,preference); else window.localStorage.removeItem(LANGUAGE_STORAGE_KEY); } catch { /* Language still works when storage is blocked. */ }
 publish();
}
export function getLanguage() { return language; }
export function getPreference() { return preference; }
export function getLocale(englishLocale: string = "en-US") { return language === "en" ? englishLocale : ({it:"it-IT",pl:"pl-PL",es:"es-ES",de:"de-DE"} as const)[language]; }
type TranslationEntry = string | Partial<Record<Intl.LDMLPluralRule,string>>;
const dictionaries: Record<Language, Record<string,TranslationEntry>> = {en:{},it,pl,es,de};
const folded = Object.fromEntries(Object.entries(dictionaries).map(([locale,entries])=>[locale,Object.fromEntries(Object.entries(entries).map(([key,value])=>[key.toLowerCase(),value]))])) as Record<Language,Record<string,TranslationEntry>>;
export function translate<T>(source:T, values?: readonly unknown[], pluralCount?: number): T extends string ? string : T;
export function translate(source:unknown, values?: readonly unknown[], pluralCount?: number): unknown {
 if (typeof source !== "string") return source;
 const key=source.trim().replace(/\s+/g," ");
 let translated: TranslationEntry | undefined = language === "en" ? undefined : Object.hasOwn(dictionaries[language],key) ? dictionaries[language][key] : Object.hasOwn(folded[language],key.toLowerCase()) ? folded[language][key.toLowerCase()] : undefined;
 if (translated && typeof translated === "object") {
  const count=pluralCount ?? Number(values?.[0]); const form=Number.isFinite(count) ? new Intl.PluralRules(getLocale()).select(count) : "other";
  translated=translated[form] ?? translated.other;
 }
 let output=translated === undefined ? source : `${source.match(/^\s*/)?.[0] ?? ""}${translated}${source.match(/\s*$/)?.[0] ?? ""}`;
 if (values) output=output.replace(/\{(\d+)\}/g,(token,index)=>Number(index)<values.length ? String(values[Number(index)]) : token);
 return output;
}
export function useLanguage() {
 const snapshot=useSyncExternalStore(listener=>{listeners.add(listener);return()=>listeners.delete(listener);},()=>`${language}:${preference ?? "auto"}`,()=>"en:auto");
 return {language:snapshot.split(":")[0] as Language,preference:snapshot.split(":")[1] === "auto" ? null : snapshot.split(":")[1] as Language,setLanguage};
}
// Module-level formatters also follow language changes without replacing data or resetting components.
export function numberFormatter(englishLocale?: Intl.LocalesArgument, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
 return new Proxy({} as Intl.NumberFormat,{get(_target,key){const formatter=new Intl.NumberFormat(getLocale(typeof englishLocale === "string" ? englishLocale : "en-US"),options);const value=Reflect.get(formatter,key,formatter);return typeof value === "function" ? value.bind(formatter) : value;}});
}
export function dateFormatter(englishLocale?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
 return new Proxy({} as Intl.DateTimeFormat,{get(_target,key){const formatter=new Intl.DateTimeFormat(getLocale(typeof englishLocale === "string" ? englishLocale : "en-US"),options);const value=Reflect.get(formatter,key,formatter);return typeof value === "function" ? value.bind(formatter) : value;}});
}
if (typeof window !== "undefined") {
 if (typeof document !== "undefined") document.documentElement.lang=language;
 window.addEventListener("languagechange",()=>{if(!preference){language=browserLanguage();publish();}});
 window.addEventListener("storage",event=>{if(event.key===LANGUAGE_STORAGE_KEY || event.key===null){preference=savedPreference();language=preference ?? browserLanguage();publish();}});
}
