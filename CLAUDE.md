# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

This repo contains a single static, mobile-first HTML page: `index.html`, a Portuguese-language ("pt-BR") site called "Lendas do UFC — Arquivo dos Campeões". It profiles seven UFC legends (Conor McGregor, Jon Jones, Georges St-Pierre, Alex "Poatan" Pereira, Anderson Silva, José Aldo, Charles Oliveira), covering their titles/belts, career records ("cartel"), and career highlights. There is no build system, package manager, framework, or test suite — it's a plain HTML/CSS/JS file meant to be opened directly in a browser.

There is currently no other tooling in the repo (no `package.json`, no README, no CI config, no linter config).

## Images — must be added locally, no AI-generated images

Each fighter card references a real photo via a local relative path (e.g. `img/conor-mcgregor.jpg`), but the `img/` folder and image files are **not** committed — this sandbox environment has no general outbound network access, so images could not be fetched or verified when the page was built. The required filenames (referenced by each `<img src="...">` in `index.html`) are:

- `img/conor-mcgregor.jpg`
- `img/jon-jones.jpg`
- `img/georges-st-pierre.jpg`
- `img/alex-pereira.jpg`
- `img/anderson-silva.jpg`
- `img/jose-aldo.jpg`
- `img/charles-oliveira.jpg`

Add real, non-AI-generated photos (e.g. from Wikimedia Commons, which offers freely reusable licenses) under those exact names before publishing. Each `.fighter-photo` element has an `onerror`/`onload` handler that toggles a `.no-photo` class, which reveals a CSS-drawn placeholder with the fighter's initials (via `data-initials`) when the image file is missing or fails to load — so the page still degrades gracefully without the photos.

## Development workflow

- No build step: edit `index.html` directly and open it in a browser (or serve it with any static file server, e.g. `python3 -m http.server`) to preview. Use a mobile viewport (or browser device toolbar) when checking layout — the page is designed mobile-first (`.wrap` max-width 560px, sticky top nav with horizontal-scrolling chips).
- No linter/formatter/test command is configured. If you add tooling (e.g. Prettier, a bundler), document the commands here.
- Fonts are loaded from Google Fonts via `@import` (Oswald, Teko) — an internet connection is required for correct rendering.
- Stats/records in the fighter cards reflect career data as of when the page was written; note the footer disclaimer, and update the numbers if a profiled (still-active) fighter's record changes.

## Structure/conventions in `index.html`

- **CSS custom properties** are centralized in `:root` (`--bg`, `--red`, `--gold`, `--text`, etc. — UFC black/red/gold palette) — reuse these variables for new colors rather than hardcoding hex values.
- **One `<article class="fighter" id="...">` per fighter**, each with the same internal structure: `.fighter-photo` (image + country flag emoji + division tag) → `.fighter-body` (`.fighter-name`, `.fighter-nick`, `.record-row` of win/loss/draw boxes, a "Cinturões" `.belt-list`, a "Destaques" `.highlight-list`). Follow this structure exactly when adding a new fighter so the sticky chip nav and CSS keep working.
- **Sticky chip nav** (`#chipnav`) holds one anchor link per fighter `id`; a small inline `<script>` at the bottom highlights the `.active` chip based on scroll position via each section's `offsetTop`. When adding/removing/reordering fighters, keep the chip nav's anchors, hrefs, and fighter `id`s in sync (the script derives `sections` from the chip `href`s, so it self-adjusts as long as ids match).
- **Accessibility**: a `prefers-reduced-motion: reduce` media query collapses all animations/transitions — preserve this when adding new ones.
- **No external JS libraries** — the scroll-highlight and top-bar shadow behavior are hand-written vanilla JS at the bottom of the file; keep new interactivity dependency-free and inline unless a real need for a build step emerges.
