# openclaw-docs-cli

Minimalist, AI-optimized documentation search for OpenClaw using Fuse.js.

## Installation

```bash
# Option 1: Install from git URL (recommended)
npm install git+https://github.com/Git-Fg/openclaw-docs-cli.git

# Option 2: Install using shorthand
npm install Git-Fg/openclaw-docs-cli

# Option 3: Clone and link (for development)
git clone https://github.com/Git-Fg/openclaw-docs-cli.git
cd openclaw-docs-cli
npm install
npm run build
npm link
```

**Note:** Requires `openclaw` package to be installed for docs auto-resolution.

## CLI

```bash
# Search - shows 📄 title + local_path + summary + read_when
ocdocs "oauth"

# Expand for full details (absolute path, docs_relative, online url, score)
ocdocs "oauth" --expand

# List all docs (discovery phase)
ocdocs --list
```

## API

```typescript
import { searchDocs, getDocs } from './dist/index.js';

// Search
const results = searchDocs('oauth config');

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
OCDOCS CLI :
You have access to `ocdocs` CLI tool, a CLI that allows you to perform for free and unlimited researches on openclaw documentation.
- First step: Run `ocdocs --help` to learn capabilities
- No need to use "&" or pipe syntax, execute the simple, full CLI like `ocdocs "oauth"`
TIPS:
- Use --expand for absolute path, urls, score, title
- If no results: split multi-word queries, adjust --threshold, or try --list
- Read files using your native tools, avoid cat unless you have no other possibilities. 
```

## Features

- **Consolidated** - Single-file core logic for zero-friction integration.
- **Fuzzy Search** - Typos and partial matches via Fuse.js.
- **AI-First** - Token-efficient text output designed for agent context windows.
- **Modern** - ESM-only with native Node.js types.

## License

MIT
