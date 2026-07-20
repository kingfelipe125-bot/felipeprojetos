# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

This repo contains a single static HTML page: `index.html`, a Portuguese-language ("pt-BR") fan/technical-archive page themed around Iron Man ("HOMEM DE FERRO — Arquivo Técnico"). There is no build system, package manager, framework, or test suite — it's a plain HTML/CSS/JS file meant to be opened directly in a browser.

There is currently no other tooling in the repo (no `package.json`, no README, no CI config, no linter config).

## Current state — file is incomplete

`index.html` is truncated: it ends mid-`<style>` block with the literal text `(truncated for brevity)` and has no `</style>`, no `<body>`, no closing `</html>`, and no JavaScript, even though the CSS references interactive behavior (e.g. `nav.scrolled`, `.suitup-stage.armed`, a "SUIT UP" `.stage-btn`, a `.scan-overlay`, section IDs implied by `.navlinks a`). Before doing any styling/content work, check whether the file has since been completed; if it still ends abruptly, flag this to the user rather than silently building on top of a broken fragment — the missing `<body>` markup and JS are likely required for the CSS to have any visible effect.

## Development workflow

- No build step: edit `index.html` directly and open it in a browser (or serve it with any static file server, e.g. `python3 -m http.server`) to preview.
- No linter/formatter/test command is configured. If you add tooling (e.g. Prettier, a bundler), document the commands here.
- Fonts are loaded from Google Fonts via `@import` (Orbitron, Rajdhani, JetBrains Mono) — an internet connection is required for correct rendering.

## Structure/conventions observed in `index.html`

- **CSS custom properties** are centralized in `:root` (e.g. `--bg`, `--stark-red`, `--gold`, `--cyan`) — reuse these variables for new colors rather than hardcoding hex values, to keep the Iron-Man red/gold/cyan color scheme consistent.
- **Naming**: utility/layout classes are short and generic (`.wrap`, `.section`, `.section-head`, `.corner-frame`); component-specific classes are prefixed by feature (`.hero-*`, `.reactor-*`, `.suitup-*`, `.armor-*`, `.stat-*`).
- **Animation pattern**: elements start in a hidden/initial state via a base class (e.g. `.suit-plate{opacity:0; transform:...}`) and animate in when a parent gains a state class (e.g. `.suitup-stage.armed .suit-plate{animation:...}`). New interactive/animated elements should follow this "base state + toggled parent class" pattern rather than relying on JS to set inline styles.
- **Accessibility**: a `prefers-reduced-motion: reduce` media query is already in place to collapse all animations/transitions — preserve this when adding new `@keyframes` or transitions.
- **Responsive breakpoints**: `@media(max-width:900px)` and `@media(max-width:760px)` are used for grid/nav collapse — follow the existing breakpoint values rather than introducing new ones.
