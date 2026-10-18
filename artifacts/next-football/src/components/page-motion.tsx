import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";

export function PageMotion({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  useEffect(() => {
    if (!window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = Array.from(document.querySelectorAll<HTMLElement>("main section, .container > section, .container > .grid > article"));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("next-in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06 });
    targets.forEach((target, index) => {
      target.classList.add("next-reveal-target");
      target.style.setProperty("--reveal-delay", `${Math.min(index % 3, 2) * 65}ms`);
      observer.observe(target);
    });
    return () => {
      observer.disconnect();
      targets.forEach(target => target.classList.remove("next-reveal-target", "next-in-view"));
    };
  }, [location]);
  return <>{children}</>;
}
