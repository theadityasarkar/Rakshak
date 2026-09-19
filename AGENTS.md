<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Megh-Drishti: Agent Operating Rules

## Project
SIH 2026 PS 26078 (MoES/NCMRWF). AI tracking of extreme weather anomalies
(3-10 day) + 12km -> 5km amplitude-preserving downscaling + 5km-radius alerts.
Existing frontend (Next.js, Leaflet, dark command-center UI) must be KEPT.
Improve it; do not redesign or rewrite from scratch.

## Next.js note
This project uses a newer Next.js with breaking changes. Before writing
frontend code, read the relevant guide in `node_modules/next/dist/docs/`
and follow its conventions (routing, data fetching, config). Do not rely
on memorized Next.js APIs.

## Non-negotiable rules
1. NEVER hardcode or fake model outputs. Any simulated/demo data must be
   loaded from /data/demo/*.json AND labeled "Demo / Scenario Simulator" in UI.
2. Work in PHASES. Finish a phase, run its verification commands, report
   results, then STOP and wait for "next phase". Do not start the next phase.
3. Before editing, read the relevant existing files. Prefer minimal diffs
   over rewriting files. Never delete existing components without asking.
4. After every change: run typecheck/lint/tests and the app. If anything
   fails, fix it before reporting. Paste actual command output, not claims.
5. If something is unclear or data is unavailable, ASK. Do not guess.
6. No placeholder code (`TODO`, `pass`, "implement later") in delivered work.
7. Scientific correctness: EFI range is [-1, +1], not percent. Say
   "extreme convective rainfall risk", not "cloudburst prediction".
8. Every phase must leave the app in a runnable state.

## Structure
/frontend  /backend (FastAPI)  /ml  /data (raw, zarr, demo)  /docs

## Definition of done (per phase)
- Code compiles, lints clean, tests pass
- Feature verified by running it (curl / browser / script), output shown
- Short changelog: files touched, what changed, how to verify