import { describe, it } from 'node:test';
import assert from 'node:assert';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { extractMetadata, searchDocs, clearCache, DEFAULT_DOCS_DIR } from './index.js';

const TEST_DOCS_DIR = join(process.cwd(), 'test-docs-tmp');

function setupTestDocs() {
    if (existsSync(TEST_DOCS_DIR)) rmSync(TEST_DOCS_DIR, { recursive: true });
    mkdirSync(TEST_DOCS_DIR);

    writeFileSync(join(TEST_DOCS_DIR, 'doc1.md'), `---
title: "Discovery"
summary: "Finding new things"
read_when: ["exploration"]
---
The word banana resides here.`);

    writeFileSync(join(TEST_DOCS_DIR, 'doc2.md'), `---
title: "Empty"
summary: "Nothing here"
---
Staircase to nowhere.`);
}

describe('OpenClaw Docs Search - Consolidated Tests', () => {
    it('extractMetadata - should parse frontmatter correctly', () => {
        setupTestDocs();
        const meta = extractMetadata(join(TEST_DOCS_DIR, 'doc1.md'));
        assert.strictEqual(meta.title, 'Discovery');
        assert.strictEqual(meta.summary, 'Finding new things');
        assert.deepStrictEqual(meta.readWhen, ['exploration']);
    });

    it('searchDocs - should find document by content', () => {
        setupTestDocs();
        clearCache();
        const results = searchDocs('banana', { docsDir: TEST_DOCS_DIR, threshold: 0.8 });
        const match = results.find(r => r.path === 'doc1.md');
        assert.ok(match, 'doc1.md should be in results for banana');
    });

    it('searchDocs - should find document by title', () => {
        setupTestDocs();
        clearCache();
        const results = searchDocs('Discovery', { docsDir: TEST_DOCS_DIR });
        assert.strictEqual(results[0]?.path, 'doc1.md');
    });

    it('searchDocs - should return all docs for empty query', () => {
        setupTestDocs();
        clearCache();
        const results = searchDocs('', { docsDir: TEST_DOCS_DIR });
        assert.strictEqual(results.length, 2);
    });

    it('DEFAULT_DOCS_DIR - should resolve to existing openclaw docs or fallback', () => {
        // Since openclaw is installed in this environment, it should resolve to node_modules/openclaw/docs
        // if not overridden by env.
        if (!process.env['DOCS_DIR']) {
            assert.ok(DEFAULT_DOCS_DIR.includes('openclaw/docs'), `Expected ${DEFAULT_DOCS_DIR} to contain openclaw/docs`);
            assert.ok(existsSync(DEFAULT_DOCS_DIR), `Default docs dir should exist: ${DEFAULT_DOCS_DIR}`);
        }
    });

    process.on('exit', () => existsSync(TEST_DOCS_DIR) && rmSync(TEST_DOCS_DIR, { recursive: true, force: true }));
});
