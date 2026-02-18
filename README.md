# nowon — Vite + React + TypeScript PWA

Minimal starter scaffolded with Bun support.

Quick start (using Bun):

- Install dependencies: `bun install`
- Run dev server: `bun dev` or `bun run dev`
- Build: `bun build`
- Preview production build: `bun run preview`

Scripts:
- `dev` — start Vite dev server
- `build` — build production assets
- `preview` — locally preview `dist/`
- `lint` — run ESLint on `src`
- `format` — run Prettier

Notes:
- This project uses `vite-plugin-pwa` with `registerType: 'autoUpdate'`.
- Service worker registration is wired via `virtual:pwa-register`.

Replace placeholder icons in `public/` with your app assets.
