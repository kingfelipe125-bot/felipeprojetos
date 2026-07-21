# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

This repo currently contains a single file: `index.html`. It is a self-contained, single-page static HTML site (Portuguese, `lang="pt-BR"`) titled "HOMEM DE FERRO — Arquivo Técnico" (an Iron Man-themed "technical archive" tribute/portfolio page). There is no build tooling, package manager config, test suite, or backend — just plain HTML/CSS (and, once finished, inline JS).

**Important:** `index.html` is currently incomplete. The file ends abruptly mid-`<style>` block (the last rule, `.armor-grid`, is unterminated) and has no `<body>`, no page content, and no closing `</style>`/`</head>`/`</html>` tags. Before adding new sections or features, check whether the file still ends this way and finish/close the existing structure rather than assuming a full page already exists.

## Working with this codebase

- Everything lives in one HTML file: CSS is inline in a `<style>` block in `<head>`; any JS should go in a `<script>` block, conventionally placed just before `</body>`.
- There is no build step. To preview changes, just open `index.html` directly in a browser (or serve the directory with any static file server, e.g. `python3 -m http.server`).
- There is no linter, formatter, or test suite configured — validate changes by visually checking the page in a browser.
- Fonts are pulled from Google Fonts via `@import` (Orbitron, Rajdhani, JetBrains Mono) — keep using these families for consistency with the existing design rather than introducing new ones.
- Design language: dark theme, defined via CSS custom properties on `:root` (`--bg`, `--stark-red`, `--gold`, `--cyan`, etc.). Reuse these variables instead of hardcoding new colors.
- Respects `prefers-reduced-motion` (animations are neutralized globally in that media query) — any new CSS animations should keep working within that override rather than being special-cased.
- Section-level conventions already established in the CSS (even though the corresponding HTML markup isn't written yet): `.section` for page sections, `.section-head` for section intros, `.wrap` as the max-width content container, `.corner-frame` for the decorative bracket-corner effect, and `.eyebrow` for small uppercase kicker labels above headings.
