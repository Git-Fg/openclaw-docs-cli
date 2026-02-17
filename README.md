# openclaw-docs-search

Minimalist, AI-optimized documentation search for OpenClaw using Fuse.js.

## Installation

```bash
# Install globally (recommended for CLI use)
npm install -g openclaw-docs-search

# Install as a dependency
npm install openclaw-docs-search
```

**Note:** Requires `openclaw` package to be installed for docs auto-resolution.

## CLI

```bash
# Search - shows path + summary + read_when by default
ocdocs "discord config"

# Expand for full details (urls, score, title)
ocdocs "discord config" --expand

# List all docs (discovery phase)
ocdocs --list
```

## API

```typescript
import { searchDocs, getDocs } from 'openclaw-docs-search';

// Search
const results = searchDocs('discord config');

// Get all docs
const allDocs = getDocs();
```

## Configuration

| Env | Description |
|-----|-------------|
| `DOCS_DIR` | Override docs directory (auto-resolved from installed `openclaw` package) |

## Minimal AGENTS.md Additions

Append these to your project's `AGENTS.md`. Do not replace your full prompt setup:

```markdown
IMPORTANT : You have access to `ocdocs` cli tool, optimized for Ai Agents.
- MANDATORY: When you need to find any information about openclaw, you must use `ocdocs --help` and extensively leverage this tool.
- Default output: path + summary + read_when (token-efficient)
- Use --expand only when you need urls/score/full details
- If no results, split multi-word queries, adjust --threshold, or try broader terms.
- Always use your native read tools for file contents; ocdocs is for discovery.
```

## Features

- **Consolidated** - Single-file core logic for zero-friction integration.
- **Fuzzy Search** - Typos and partial matches via Fuse.js.
- **AI-First** - Token-efficient text output designed for agent context windows.
- **Modern** - Dual CJS/ESM support, native Node.js types.

## License

MIT
