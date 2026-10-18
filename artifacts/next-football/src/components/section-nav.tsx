import { translate, useLanguage } from "@/i18n";
import { Link } from "wouter";
export function SectionNav({ base, active, items, label }: { base: string; active: string; items: readonly (readonly [string,string])[]; label: string }) {
  useLanguage();
 return <nav className="next-section-nav" aria-label={translate(label)}>{items.map(([key,title])=><Link key={key} href={key === "overview" ? base : `${base}/${key}`} aria-current={active === key ? "page" : undefined}>{translate(title)}</Link>)}</nav>;
}
