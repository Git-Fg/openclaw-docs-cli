/**
 * OpenClaw Docs Search - Consolidated Core
 * Fuse.js fuzzy matching, metadata extraction, and terminal formatting.
 */

import Fuse from 'fuse.js';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, dirname } from 'node:path';

export interface DocMetadata {
  title: string | null;
  summary: string | null;
  readWhen: string[];
  error?: string;
}

export interface Document extends DocMetadata {
  path: string;
  cwdRelative: string;
  local: string;
  online: string;
  content: string;
}

export interface SearchResult extends Document {
  score: number;
  matches?: Array<{
    key: keyof Document;
    value: string;
    indices: [number, number][];
  }>;
}

export interface SearchOptions {
  docsDir?: string;
  threshold?: number;
  limit?: number;
  includeScore?: boolean;
  includeMatches?: boolean;
}

export type OutputFormat = 'default' | 'expanded';

export const VERSION = '3.0.0';
export const ONLINE_BASE = 'https://docs.openclaw.ai';
export const EXCLUDED_DIRS = new Set(['archive', 'research', '.i18n', 'ja-JP', 'zh-CN']);

function resolveDocsDir(): string {
  if (process.env['DOCS_DIR']) return process.env['DOCS_DIR'];
  try {
    const req = createRequire(import.meta.url);
    const entryPath = req.resolve('openclaw');
    // From node_modules/openclaw/dist/index.js to node_modules/openclaw/docs
    return join(dirname(entryPath), '..', 'docs');
  } catch {
    return '/usr/lib/node_modules/openclaw/docs';
  }
}

export const DEFAULT_DOCS_DIR = resolveDocsDir();

export class DocsDirectoryError extends Error {
  constructor(path: string) {
    super(`Docs directory not found: ${path}`);
    this.name = 'DocsDirectoryError';
  }
}

export class FrontmatterParseError extends Error {
  constructor(path: string, public readonly reason: 'missing' | 'unterminated') {
    super(`Frontmatter parse error in ${path}: ${reason}`);
    this.name = 'FrontmatterParseError';
  }
}

/** Recursively walk markdown files */
export function walkMarkdownFiles(dir: string, base: string = dir): string[] {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      files.push(...walkMarkdownFiles(fullPath, base));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(relative(base, fullPath));
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
}

/** Extract metadata from markdown frontmatter */
export function extractMetadata(fullPath: string): DocMetadata {
  const content = readFileSync(fullPath, 'utf8');
  if (!content.startsWith('---')) {
    return { title: null, summary: null, readWhen: [], error: 'missing front matter' };
  }

  const endIndex = content.indexOf('\n---', 3);
  if (endIndex === -1) throw new FrontmatterParseError(fullPath, 'unterminated');

  const metaText = content.slice(3, endIndex).trim();
  const lines = metaText.split('\n');

  let title: string | null = null;
  let summary: string | null = null;
  const readWhen: string[] = [];
  let currentField: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('title:')) {
      title = trimmed.slice(6).trim().replace(/^['"]|['"]$/g, '');
    } else if (trimmed.startsWith('summary:')) {
      summary = trimmed.slice(8).trim().replace(/^['"]|['"]$/g, '');
    } else if (trimmed.startsWith('read_when:')) {
      currentField = 'read_when';
      const inline = trimmed.slice(10).trim();
      if (inline.startsWith('[') && inline.endsWith(']')) {
        try {
          const parsed = JSON.parse(inline.replace(/'/g, '"'));
          if (Array.isArray(parsed)) readWhen.push(...parsed);
        } catch { }
      }
    } else if (currentField === 'read_when' && trimmed.startsWith('- ')) {
      readWhen.push(trimmed.slice(2).trim());
    }
  }
  return { title, summary, readWhen };
}

/** Load all documents into memory */
export function loadDocs(docsDir: string = DEFAULT_DOCS_DIR): Document[] {
  if (!existsSync(docsDir)) throw new DocsDirectoryError(docsDir);
  const files = walkMarkdownFiles(docsDir);
  return files.map(rel => {
    const local = join(docsDir, rel);
    const meta = extractMetadata(local);
    return {
      ...meta,
      path: rel,
      cwdRelative: relative(process.cwd(), local),
      local,
      online: `${ONLINE_BASE}/${rel.replace(/\.md$/, '')}`,
      content: readFileSync(local, 'utf8'),
    };
  });
}

let cache: Document[] | null = null;
let cachedDir: string | null = null;

export function getDocs(docsDir: string = DEFAULT_DOCS_DIR): Document[] {
  if (cache && cachedDir === docsDir) return cache;
  cache = loadDocs(docsDir);
  cachedDir = docsDir;
  return cache;
}

export function clearCache() { cache = null; cachedDir = null; }

/** Search documentation using Fuse.js */
export function searchDocs(query: string = '', options: SearchOptions = {}): SearchResult[] {
  const { docsDir = DEFAULT_DOCS_DIR, threshold = 0.4, limit = 50, includeScore = true, includeMatches = false } = options;
  const docs = getDocs(docsDir);

  if (!query.trim()) return docs.slice(0, limit).map(d => ({ ...d, score: 1 }));

  const fuse = new Fuse(docs, {
    keys: [
      { name: 'title', weight: 1.0 },
      { name: 'readWhen', weight: 0.8 },
      { name: 'summary', weight: 0.6 },
      { name: 'content', weight: 0.4 },
    ],
    threshold,
    includeScore,
    includeMatches,
    shouldSort: true,
    minMatchCharLength: 2,
    ignoreLocation: true,
  });

  return fuse.search(query, { limit }).map(res => ({
    ...res.item,
    score: res.score ?? 0,
    ...(includeMatches && res.matches ? {
      matches: res.matches.map(m => ({
        key: m.key as keyof Document,
        value: m.value!,
        indices: m.indices as [number, number][],
      }))
    } : {})
  }));
}

/** Get suggestions for misspelled queries */
export function getSuggestions(query: string, docs: Document[], maxSuggestions: number = 3): string[] {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const allTerms = new Set<string>();
  for (const doc of docs) {
    const text = `${doc.title ?? ''} ${doc.summary ?? ''} ${doc.path}`.toLowerCase();
    const terms = text.match(/[a-z]{4,}/g) ?? [];
    terms.forEach(t => allTerms.add(t));
  }

  const suggestions: string[] = [];
  for (const word of words) {
    let best = { match: '', score: 0 };
    for (const term of allTerms) {
      const score = calculateSimilarity(word, term);
      if (score > best.score && score > 0.6 && score < 1) best = { match: term, score };
    }
    if (best.match && !suggestions.includes(best.match)) suggestions.push(best.match);
  }
  return suggestions.slice(0, maxSuggestions);
}

function calculateSimilarity(a: string, b: string): number {
  const getGrams = (s: string) => {
    const n = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const g = new Set<string>();
    for (let i = 0; i <= n.length - 3; i++) g.add(n.slice(i, i + 3));
    return g;
  };
  const ga = getGrams(a), gb = getGrams(b);
  if (ga.size === 0 || gb.size === 0) return 0;
  const intersect = new Set([...ga].filter(x => gb.has(x)));
  return intersect.size / new Set([...ga, ...gb]).size;
}

// --- Formatting ---

const colors = { reset: '\x1b[0m', bold: '\x1b[1m', blue: '\x1b[34m', dim: '\x1b[2m', yellow: '\x1b[33m' };
const c = (t: string, k: keyof typeof colors) => `${colors[k]}${t}${colors.reset}`;

const REMINDER = () => `⚠️ REMINDER: Use native read tools for file contents; ocdocs for discovery. Run "ocdocs --help" to refresh your knowledge on how to use it.`;

export function formatResults(results: SearchResult[], format: OutputFormat, query: string = ''): string {
  if (results.length === 0) return c('No results found.\n', 'dim');

  if (format === 'expanded') {
    let out = query ? c(`Searching for: "${query}"\n\n`, 'bold') : c('All Documents\n\n', 'bold');
    for (const r of results) {
      out += c(`${r.local} (score: ${(1 - r.score).toFixed(2)})`, 'bold') + '\n';
      out += c(`   Relative: `, 'dim') + r.path + '\n';
      out += c(`   Online: `, 'dim') + c(r.online, 'blue') + '\n';
      if (r.title) out += c(`   Title:  `, 'dim') + r.title + '\n';
      if (r.summary) out += c(`   Summary:`, 'dim') + r.summary + '\n';
      if (r.readWhen.length) out += c(`   Read When:`, 'dim') + r.readWhen.join('; ') + '\n';
      if (r.error) out += c(`   Error:  ${r.error}`, 'yellow') + '\n';
      out += '\n';
    }
    return out + c(`Found ${results.length} result${results.length !== 1 ? 's' : ''}\n`, 'dim') +
      c(`\n${REMINDER()}\n`, 'dim');
  }

  // Default format: cwd-relative path + summary + read_when only (token-efficient for agents)
  let out = '';
  for (const r of results) {
    out += `${r.cwdRelative}\n`;
    if (r.summary) out += `  ${c('Summary:', 'dim')} ${r.summary}\n`;
    if (r.readWhen.length) out += `  ${c('Read When:', 'dim')} ${r.readWhen.join('; ')}\n`;
    out += '\n';
  }
  return out + c(`Found ${results.length} result${results.length !== 1 ? 's' : ''}\n`, 'dim') +
    c(`\n${REMINDER()}\n`, 'dim');
}

export function extractContext(content: string, query: string, size = 80): string | null {
  const i = content.toLowerCase().indexOf(query.toLowerCase());
  if (i === -1) return null;
  const s = Math.max(0, i - size), e = Math.min(content.length, i + query.length + size);
  return (s > 0 ? '...' : '') + content.slice(s, e) + (e < content.length ? '...' : '');
}
