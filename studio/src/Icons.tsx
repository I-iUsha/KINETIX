// kinetiX Studio — custom icon language.
// Each glyph encodes its concept (built from the aperture geometry); NO icon
// libraries, NO emoji. Raw SVG is injected so the exact paths/attrs survive.

const DEFS = `
<defs>
  <symbol id="i-new" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h7l5 5v13H6z"/><path d="M13 3v5h5"/><path d="M12 12v5M9.5 14.5h5"/></symbol>
  <symbol id="i-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 6h6l2 2.5h10V19H3z"/></symbol>
  <symbol id="i-import" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 15v4h16v-4"/><path d="M12 4v10M8 10l4 4 4-4"/></symbol>
  <symbol id="i-aperture" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8.5"/><path d="M12 12 12 3.5M12 12 19.4 16.2M12 12 4.6 16.2"/></symbol>
  <symbol id="i-stability" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3v11"/><path d="M9.4 14h5.2L12 19z" fill="currentColor" stroke="none"/><path d="M4 21h16"/></symbol>
  <symbol id="i-collision" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="12" r="5.5"/><circle cx="15" cy="12" r="5.5"/></symbol>
  <symbol id="i-constraints" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 4H4v16h3M17 4h3v16h-3"/><path d="M12 9l3 3-3 3-3-3z"/></symbol>
  <symbol id="i-reach" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 18l5-5 4 2 7-9"/><circle cx="4" cy="18" r="1.6" fill="currentColor" stroke="none"/><circle cx="9" cy="13" r="1.6" fill="currentColor" stroke="none"/><circle cx="13" cy="15" r="1.6" fill="currentColor" stroke="none"/><circle cx="20" cy="6" r="1.6" fill="currentColor" stroke="none"/></symbol>
  <symbol id="i-commit" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M19 4v16"/><path d="M4 12h11M11 8l4 4-4 4"/></symbol>
  <symbol id="i-mass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><circle cx="12" cy="14.5" r="2.2" fill="currentColor" stroke="none"/></symbol>
  <symbol id="i-com" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M14 5v14M5 9h14" opacity=".5"/><circle cx="14" cy="9" r="2.1" fill="currentColor" stroke="none"/></symbol>
  <symbol id="i-solid" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="7.5" fill="currentColor" stroke="none"/></symbol>
  <symbol id="i-seal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3l7 4v6c0 4.4-3 7-7 8-4-1-7-3.6-7-8V7z"/></symbol>
  <symbol id="i-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="11" width="14" height="9" rx="1.4"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></symbol>
  <symbol id="i-grid" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 9h16M4 15h16M9 4v16M15 4v16"/></symbol>
  <symbol id="i-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></symbol>
  <symbol id="i-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.6"/></symbol>
  <symbol id="i-eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4l16 16"/><path d="M9.5 5.4A9.6 9.6 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-3.2 3.6M6.2 7.8A16 16 0 0 0 2 12s3.5 6 10 6a9.6 9.6 0 0 0 3-.5"/></symbol>
  <symbol id="i-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 5v14M5 12h14"/></symbol>
  <symbol id="i-caret" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M6 9l6 6 6-6z"/></symbol>
</defs>`

export function IconDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden dangerouslySetInnerHTML={{ __html: DEFS }} />
  )
}

export function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <svg className={className} aria-hidden>
      <use href={`#i-${name}`} />
    </svg>
  )
}
