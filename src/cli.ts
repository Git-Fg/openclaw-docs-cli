#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { searchDocs, getDocs, getSuggestions, formatResults, type SearchResult, VERSION } from './index.js';

const HELP = `
ocdocs v${VERSION} - OpenClaw Documentation Search

USAGE: ocdocs <query> [options]

OPTIONS:
  --list          List all documents (no search)
  --limit N       Max results (default: 20)
  --threshold T   Fuzzy match threshold 0-1 (default: 0.35)
  --expand        Show all fields (urls, score, title)
  --help          Show this help
  --version       Show version

ENVIRONMENT:
  DOCS_DIR        Override docs directory (/usr/lib/node_modules/openclaw/docs)

SEARCH BEHAVIOR:
  - Default output shows: cwd-relative path (node_modules/...), summary, read_when
  - Use --expand for absolute path, docs-relative path, urls, score, title
  - Multi-word queries: Automatically splits and recombines if no exact match
  - Threshold: Lower = stricter matching (try 0.3 for stricter, 0.5 for looser)

EXAMPLES:
  ocdocs "oauth"           # Search for OAuth documentation
  ocdocs "webhook config"   # Find webhook configuration docs
  ocdocs "agent" --limit 3  # Get top 3 results about agents
`;

async function main() {
  const { values, positionals } = parseArgs({
    options: {
      list: { type: 'boolean' },
      limit: { type: 'string', default: '20' },
      threshold: { type: 'string', default: '0.35' },
      expand: { type: 'boolean' },
      help: { type: 'boolean' },
      version: { type: 'boolean' },
    },
    allowPositionals: true,
  });

  if (values.help) return console.log(HELP);
  if (values.version) return console.log(VERSION);

  const query = positionals.join(' ').trim();
  const docsDir = process.env['DOCS_DIR'];
  const limit = parseInt(values.limit!, 10);
  const threshold = parseFloat(values.threshold!);

  if (values.list) {
    const docs = getDocs(docsDir);
    return console.log(docs.map(d => d.cwdRelative).join('\n'));
  }

  if (!query) {
    return console.log(HELP);
  }

  let results = searchDocs(query, { docsDir, threshold, limit });

  // Fallback for multi-word queries
  if (results.length === 0 && query.includes(' ')) {
    const words = query.split(/\s+/).filter(w => w.length > 2);
    const combined = new Map<string, SearchResult>();
    for (const word of words) {
      searchDocs(word, { docsDir, threshold: threshold * 1.2, limit: 10 })
        .forEach(r => (!combined.has(r.path) || r.score < combined.get(r.path)!.score) && combined.set(r.path, r));
    }
    results = [...combined.values()].sort((a, b) => a.score - b.score).slice(0, limit);
    if (results.length > 0) console.log(`⚠️  No exact matches. Showing fallback results...\n`);
  }

  if (results.length === 0) {
    console.error(`No results for: "${query}"`);
    const suggestions = getSuggestions(query, getDocs(docsDir));
    if (suggestions.length) console.error(`Did you mean: ${suggestions.join(', ')}?`);
    console.error(`Try: split multi-word queries, adjust --threshold, or --list`);
    process.exit(1);
  }

  console.log(formatResults(results, values.expand ? 'expanded' : 'default', query));
}

main().catch(err => {
  console.error('Error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
