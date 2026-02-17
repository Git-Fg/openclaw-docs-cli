# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Test
- Build: `npm run build` (outputs to `dist/`)
- Watch mode: `npm run dev` (rebuilds on file changes)
- Test: `npm test` (uses Node.js native test runner on `dist/*.test.js`)
- Single test: `node --test dist/index.test.js` (or any specific test file)
- Lint: `npm run lint` (TSC type-check only, no emit)

## Project Architecture
- `src/index.ts`: Consolidated core library. Contains types, Fuse.js search logic, metadata extraction, result formatting, and custom error types (`DocsDirectoryError`, `FrontmatterParseError`).
- `src/cli.ts`: Minimalist CLI wrapper. Implements fallback search for multi-word queries (splits and recombines results) and spell suggestions via `getSuggestions()`.
- `src/index.test.ts`: Unit tests using Node.js native runner. Uses temp directory setup/teardown pattern; calls `clearCache()` before each search test to bypass module-level caching.

## Search Configuration
- Weights: Title (1.0), readWhen (0.8), summary (0.6), content (0.4).
- Threshold: 0.4 (default), CLI uses 0.35.
- `ignoreLocation: true` is enabled for robust document body searching.

## Golden Paths

**Finding OpenClaw documentation:**
1. Default: `ocdocs "<query>"` or `openclaw-docs-cli "<query>"` → returns path + summary + read_when (token-efficient)
2. No results? Try: split multi-word terms, `--threshold 0.3`, or `--list` for discovery
3. Need full details? Use `ocdocs "<query>" --expand` (adds urls, score, title)
4. Always use native Read tool for file contents; `ocdocs` is for discovery only

**Output format principle:** Minimal by default, verbose on request. This keeps token costs low for the common case (finding the right doc) while allowing detail when needed.

## Key Patterns
- **Module-level cache**: `getDocs()` caches results per directory; use `clearCache()` in tests to isolate state.
- **Consolidated core**: `src/index.ts` is the single source of truth for library logic.
- **ESM First**: Compiled as ESM with dual entry via `package.json` exports.
- **Minimal dependencies**: Only `fuse.js` required; `openclaw` is peer/optional.

## AI-Agent CLI Design Principles

**Core pattern:** Minimal output by default, opt-in verbosity. Agents consume CLIs mostly for discovery; details should be on-demand.

1. **Self-Teaching via `--help`**: Help text must be a complete reference—assume the agent reads nothing else first.
2. **Semantic Density**: Flat text > JSON (30-40% cheaper). Use fixed labels as anchors.
3. **TTY Detection**: Strip visuals (emojis, spinners, colors) when `!process.stdout.isTTY`.
4. **Actionable Failures**: When no results, suggest the next step (e.g., "split query", "lower threshold").
5. **README Snippet**: Provide copy-pasteable AGENTS.md block explaining when/how to use the tool.
