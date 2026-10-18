export function PitchArt({ blockball = false }: { blockball?: boolean }) {
  return <div className={`next-pitch-art ${blockball ? "next-pitch-blocks" : ""}`} aria-hidden="true">
    <svg viewBox="0 0 600 380" fill="none"><g className="next-pitch-lines" stroke="currentColor" strokeWidth="2"><path d="M35 35H565V345H35Z"/><path d="M300 35V345"/><circle cx="300" cy="190" r="57"/><path d="M35 100H120V280H35M565 100H480V280H565M35 145H70V235H35M565 145H530V235H565"/></g><path className="next-play-path" d={blockball ? "M150 260H255V190H365V130H490" : "M135 270Q210 265 250 195T385 140T490 190"} stroke="currentColor" strokeWidth="3" strokeDasharray="6 10"/><g fill="currentColor"><circle cx="135" cy="270" r="7"/><circle cx="250" cy="195" r="7"/><circle cx="385" cy="140" r="7"/></g><g transform="translate(480 180) rotate(-12)"><rect width="20" height="20" fill="currentColor"/><path d="M0 0L10 -6L30 -6L20 0M20 0L30 -6V14L20 20" stroke="currentColor" strokeWidth="2"/></g></svg>
    <span className="next-pitch-word">{blockball ? "BB" : "FC"}</span>
  </div>;
}
