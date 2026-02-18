# openclaw-docs-cli

Minimalist, AI-optimized documentation search for OpenClaw using Fuse.js.



/!\ UPDATE : That is now useless, `openclaw docs` finally shows the local path alongside the url. /!\ 



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
import { searchDocs, getDocs } from 'openclaw-docs-cli';

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
IMPORTANT: You have access to `ocdocs` CLI tool, optimized for AI Agents.
- First step: Run `ocdocs --help` to learn capabilities
- Default output: cwd-relative path (node_modules/...) + summary + read_when (token-efficient)
- Use --expand for absolute path, urls, score, title
- If no results: split multi-word queries, adjust --threshold, or try --list
- Paths are usable directly with Read tool; ocdocs is for discovery only
```

## Features

- **Consolidated** - Single-file core logic for zero-friction integration.
- **Fuzzy Search** - Typos and partial matches via Fuse.js.
- **AI-First** - Token-efficient text output designed for agent context windows.
- **Modern** - Dual CJS/ESM support, native Node.js types.

## License

MIT
