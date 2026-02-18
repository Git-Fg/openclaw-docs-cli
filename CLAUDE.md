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
1. Run `ocdocs` (no args) → shows help with example queries to try
2. Default: `ocdocs "<query>"` → returns cwd-relative path (node_modules/...) + summary + read_when
3. Expanded: `ocdocs "<query>" --expand` → returns absolute path + docs-relative path + urls + score + title
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
3. **Token-Efficient Output**: No spammy progress bars (tqdm-style). If progress is needed, show every 10% with time estimate (max ~10 updates). No interactive elements.
4. **Actionable Failures**: When no results, suggest the next step (e.g., "split query", "lower threshold").
5. **Visual Elements**: 2 emojis max - only for warnings (⚠️) and critical reminders. No decorative icons.

## Agent-Optimized Path Handling

**Principle:** Paths shown to agents must be directly usable with Read/Glob tools - no mental translation required.

**Two path types to understand:**

| Type | Example | When to use |
|------|---------|-------------|
| `cwdRelative` | `node_modules/openclaw/docs/concepts/oauth.md` | Default output, --list, agent consumption |
| `path` (docs-relative) | `concepts/oauth.md` | Expanded mode reference, internal use |
| `local` (absolute) | `/Users/.../node_modules/.../oauth.md` | Expanded mode primary entry |

**Rules:**
- **Default mode**: Show `cwdRelative` (from `process.cwd()`) - agent can copy-paste to Read tool
- **`--list`**: Show `cwdRelative` - must be consistent with default search output
- **Expanded mode**: Show absolute path as primary, with `path` (docs-relative) labeled as "Relative:"
- **Never show**: Paths relative to internal directories that agents can't access directly

**Implementation pattern:**
```typescript
// In Document type:
cwdRelative: relative(process.cwd(), local)  // For agent consumption
path: relative(docsDir, local)              // For internal reference
local: join(docsDir, rel)                   // Absolute path
```

**Testing verification:** Run the CLI as an agent would - try using the returned paths directly with Read tool.
