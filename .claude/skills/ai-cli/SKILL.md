---
name: ai-cli
description: This skill should be used when building or refactoring CLI tools for AI agent consumption. Use when the user asks to "build an agent-friendly CLI", "optimize CLI for AI", "make CLI self-teaching", "design CLI for LLMs", "create agent-oriented tool output", or mentions token-efficient output, semantic density, TTY detection, or agent discovery patterns.
metadata:
  author: Git-FG
  version: "1.0"
---

# AI-Agent CLI Design Skill

Build CLI tools that AI agents can discover, understand, and use efficiently without prior training.

## About AI-Agent CLI Design

Traditional CLI design optimizes for human users with muscle memory and intuition. AI-agent CLI design optimizes for self-teaching, token efficiency, and failure recovery.

### What This Skill Provides

1. **Self-Teaching Pattern** - `--help` as complete manual; agents learn by reading, not doing
2. **Semantic Density** - Natural language text, not JSON; matches LLM native parsing
3. **Failure Recovery** - Actionable next steps instead of error codes
4. **Attention Management** - Counteract lost-in-the-middle with reminders
5. **TTY Awareness** - Strip visuals when piped

### Why This Matters

Agents consume CLIs differently than humans:

| Human User | AI Agent |
|------------|----------|
| Has muscle memory | Has `--help` |
| Has intuition | Has patterns |
| Unlimited attention | Token budget |
| Learns by doing | Learns by reading |
| Visual processing | Natural language parsing |

**Key insight:** A CLI designed for agents serves humans too. The reverse is not true.

---

## Core Mental Model

```
┌─────────────────────────────────────────────────────────────┐
│  THE TRUST LOOP                                              │
│                                                             │
│  Give minimal guidance + "run --help"                       │
│           ↓                                                 │
│  Agent runs --help, learns capabilities                     │
│           ↓                                                 │
│  Agent uses tool correctly based on what they learned       │
│           ↓                                                 │
│  Tool provides actionable failures if stuck                 │
│           ↓                                                 │
│  Footer reminder reinforces: "run --help if unsure"         │
└─────────────────────────────────────────────────────────────┘
```

**The golden rule:** Trust agents to read and understand. Teach principles, not prescriptions.

---

## 1. The `--help` Contract

The tool must teach itself. `--help` is the complete manual—assume nothing else exists.

### What Makes Good Self-Teaching Documentation

```text
# ❌ Bad - assumes prior knowledge
USAGE: tool [options]
OPTIONS: --help, --version

# ✅ Good - complete self-contained manual
USAGE: tool <query> [options]

DESCRIPTION:
  What this tool does, in plain language. Why it exists.

OPTIONS:
  --flag-a     What it does, when to use it
  --flag-b     What it does, default value, when to adjust
  --verbose    Show more details (when you might need it)
  --help       Show this manual

BEHAVIOR:
  - What the default output shows and why
  - How flags change behavior
  - What happens when things go wrong
  - How to recover from failures

EXAMPLES:
  tool "query"                    # Basic usage
  tool "query" --flag-b value     # When to use this flag
  tool --list                     # Discovery phase
```

### The Discovery Pattern

Agents need to discover what exists before querying.

```
Provide a flag that shows available items:
  --list          Enumerate all searchable items
  --ls            List all available resources
  --show-all      Display everything the tool knows about
```

Name doesn't matter. Purpose and semantic match matters: **discovery before search**.

### Progressive Disclosure in `--help`

```text
BEHAVIOR:
  - Default: minimal output (what you need 80% of the time)
  - Use --verbose for full details (when you need urls/ids/scores)
  - Multi-word terms: auto-split and recombine if no match
  - Empty results: try broader terms, adjust threshold, or --list
```

Notice: No specific flag names are prescribed. Teach the pattern, not the implementation.

**DO:**
- Make `--help` self-contained (no external docs required)
- Explain the WHY behind each option
- Include a BEHAVIOR section that explains defaults and alternatives
- Provide concrete examples showing when to use each flag
- Mention discovery flag (`--list` or equivalent)

**DON'T:**
- Assume agents know what flags do from names alone
- Require external documentation to understand usage
- Omit explanation of what the default output shows and why
- Use generic names without explaining purpose

---

## 2. Semantic Density

Every token matters. Use natural language—the agent's native format.

### Natural Language > JSON

```
JSON:      {"path":"file.md","score":0.15,"summary":"..."}  # ~40% more tokens
Text:      file.md (0.15)                                 # understood through natural language
```

Why? LLMs are trained on natural language. Text format matches their native parsing. JSON adds structural overhead without adding semantic value.

### Fixed Labels as Anchors

```text
# Agents parse by label, not position
Path:     getting-started.md
Score:    0.15
Summary:  How to get started
ReadWhen: You are new to the project
```

Labels act as anchors—names that stay consistent even if position changes.

### Minimal Default, Opt-In Verbose

**Principle:** Show what agents need most of the time by default. Provide verbose mode for details.

```text
# Default: essential information only
getting-started.md
  Summary: How to get started
  ReadWhen: You are new to the project

# Verbose: full details when needed
getting-started.md (score: 0.15)
  Path:     getting-started.md
  Local:    /usr/lib/docs/getting-started.md
  Online:   https://docs.example.com/getting-started
  Title:    Getting Started
  Summary:  How to get started
  ReadWhen: You are new to the project
```

The flag name (`--verbose`, `--expand`, `--detail`) doesn't matter. The pattern matters: minimal by default, verbose on demand.

**DO:**
- Default to minimal output (what's needed 80% of the time)
- Use natural language text format
- Provide verbose flag for full details
- Use fixed labels as parsing anchors

**DON'T:**
- Show all fields by default (token waste)
- Use JSON unless specifically requested
- Use positional parsing (brittle across versions)
- Include decorative elements in default mode

---

## 3. TTY Detection

Strip visuals when piped. Agents consume output programmatically.

### The Pattern

```typescript
// Strict check: TTY is a boolean, not just truthy
const isTTY = process.stdout.isTTY === true;
const color = (text, code) => isTTY ? `\x1b[${code}m${text}\x1b[0m` : text;
const emoji = (text) => isTTY ? text : text.replace(/\p{Emoji}/gu, '');
```

### Behavior

```text
# Terminal (TTY) → visuals shown
🚨 REMINDER: Use native read tools for file contents

# Piped (non-TTY) → clean text
REMINDER: Use native read tools for file contents
```

**DO:**
- Use strict equality: `process.stdout.isTTY === true`
- Strip colors, emojis, spinners when piped
- Preserve semantic content (labels, values)

**DON'T:**
- Use truthy check: `process.stdout.isTTY` (can be undefined)
- Strip semantic labels along with visuals
- Assume TTY is always boolean

---

## 4. Actionable Failures (The Pivot)

When things go wrong, teach the next step. Not just "error."

### The Pattern

```text
# ❌ Bad - dead end
Error: No results found

# ✅ Good - forward momentum
No results for: "multi word query"
💡 Try splitting: "multi" OR "word" OR "query"
💡 Or use: --threshold 0.5 for looser matching
```

### Failure Modes to Handle

| Situation | Teach This |
|-----------|------------|
| No results | Split terms, broaden search, try discovery flag |
| Permission denied | Check permissions, try with elevation |
| Missing dependency | Install command, where to get it |
| Ambiguous input | Show top matches, ask to clarify |
| Invalid format | Show expected format, provide example |

The specific recovery actions depend on the tool. Teach the principle: **always suggest next steps**.

**DO:**
- Include specific next steps for each failure mode
- Suggest flag adjustments or alternatives
- Show example corrections when possible
- Use stderr for suggestions, stdout for results

**DON'T:**
- Return generic error codes without context
- Require documentation lookup for recovery
- Blame the user ("invalid input")
- Use stderr for results (breaks piping)

---

## 5. Footer Reminder Pattern

Counteract lost-in-the-middle and recency bias. Reinforce the trust loop.

### The Pattern

```text
Found 15 results

REMINDER: Use native read tools for file contents; <tool> for discovery.
Run "<tool> --help" to refresh your knowledge on how to use it.
```

### Why This Matters

| Cognitive Effect | Reminder Counteracts |
|------------------|---------------------|
| Lost-in-the-middle | Re-teaches core pattern |
| Recency bias | Latest tokens = guidance |
| Flag amnesia | Points back to `--help` |
| Stuck states | Shows forward path |

The reminder isn't just reinforcement—it's managing attention dynamics in long conversations.

### What the Reminder Should Teach

1. **Tool's role**: What it's for (discovery vs reading)
2. **Next action**: What to do with results
3. **Self-recovery**: "Run --help" if stuck

The exact wording is tool-specific. The pattern is universal.

**DO:**
- Include reminder after every result set
- Mention `--help` for self-recovery
- Distinguish tool's purpose from other actions
- Strip emoji when non-TTY

**DON'T:**
- Make reminder verbose (keep under 2-3 lines)
- Include tool-specific implementation details
- Skip the `--help` refresh option

---

## 6. AGENTS.md Integration

Provide copy-pasteable guidance for project READMEs.

### The Pattern

```markdown
## For AI Agents

You have access to `<tool>` CLI, optimized for agent consumption.

**When to use:**
- MANDATORY for <domain> queries
- First step: Run `<tool> --help` to learn options
- Default output: <what it shows> (token-efficient)
- Use <verbose-flag> only when you need <extra-info>

**If no results:**
- Split multi-word queries
- Adjust <threshold-param> for stricter/looser matching
- Try <discovery-flag> to see all available

**After finding paths:**
- Always use native read tools for file contents
- <tool> is for discovery, not reading
```

Fill in the placeholders. Keep the structure.

**DO:**
- Include in README under "For AI Agents" or similar
- Make it copy-pasteable
- Keep it tool-specific but non-brittle
- Cover: when to use, defaults, failures, next steps
- Keep under 10 lines (token budget)

**DON'T:**
- Duplicate `--help` content (refer to it instead)
- Include specific examples (those go in `--help`)
- Make it verbose (agents skim)

---

## Complete Example

```text
# docs-search v1.0 - Semantic documentation search

USAGE: docs-search <query> [options]

DESCRIPTION:
  Search documentation by semantic matching. Finds relevant files even with typos.

OPTIONS:
  --list          List all documents (discovery phase)
  --limit N       Max results (default: 20)
  --threshold T   Fuzzy threshold 0-1 (default: 0.35, lower = stricter)
  --verbose       Show all fields (urls, score, title)
  --help          Show this manual

BEHAVIOR:
  - Default output: path + summary + read_when (token-efficient)
  - Use --verbose for full details when needed
  - Multi-word queries: auto-split and recombine if no match
  - If no results: try broader terms, lower threshold, or --list

EXAMPLES:
  docs-search "oauth config"           # Semantic search
  docs-search "oauth" --limit 3        # Token management
  docs-search --list | head -n 5       # Discovery phase
```

---

## Best Practices Summary

### DO

✅ Make `--help` a complete self-contained manual
✅ Explain WHY behind each option, not just WHAT
✅ Include BEHAVIOR section in `--help`
✅ Default to minimal output, provide verbose flag
✅ Use natural language text format
✅ Use fixed labels as parsing anchors
✅ Strip visuals when `!process.stdout.isTTY`
✅ Include actionable next steps on failures
✅ Add footer reminder teaching `--help` self-recovery
✅ Include AGENTS.md section in README
✅ Trust agents to read and understand

### DON'T

❌ Assume prior knowledge in `--help`
❌ Require external documentation
❌ Show all fields by default (token waste)
❌ Use JSON output unless requested
❌ Use positional parsing (brittle)
❌ Return generic errors without recovery suggestions
❌ Make footer reminder verbose
❌ Duplicate `--help` in AGENTS.md
❌ Prescribe specific flag names (teach patterns)

---

## Writing Style Requirements

### Imperative/Infinitive Form

Write using verb-first instructions:

**Correct:**
```
Include a --list flag for discovery.
Explain each option's purpose inline.
Provide concrete examples.
```

**Incorrect:**
```
You should include a --list flag.
The tool explains each option.
Users can see examples.
```

### Objective Language

Focus on what to do, not who should do it:

**Correct:**
```
Parse the frontmatter using sed.
Extract fields with grep.
Validate values before use.
```

**Incorrect:**
```
You can parse the frontmatter...
Claude should extract fields...
The user might validate values...
```

---

## Validation Checklist

Before finalizing an AI-agent CLI:

**`--help` Content:**
- [ ] Self-contained (no external docs required)
- [ ] Explains WHY behind each option
- [ ] Includes BEHAVIOR section (defaults + alternatives)
- [ ] Provides concrete examples
- [ ] Has discovery flag (`--list` or equivalent)

**Output Format:**
- [ ] Default is minimal (80% case)
- [ ] Verbose flag for full details
- [ ] Fixed labels as anchors
- [ ] Natural language text format
- [ ] Footer reminder included

**TTY Detection:**
- [ ] Uses `process.stdout.isTTY === true`
- [ ] Strips colors/emojis when piped
- [ ] Preserves semantic content

**Failure Handling:**
- [ ] Each failure has actionable next step
- [ ] Suggests alternatives
- [ ] Shows corrections when possible

**Documentation:**
- [ ] README has AGENTS.md section
- [ ] Copy-pasteable format
- [ ] Under 10 lines
- [ ] Covers: when to use, defaults, failures

**Testing:**
- [ ] Tested TTY output
- [ ] Tested piped output
- [ ] Agent can learn from `--help` alone
- [ ] Failures provide recovery path

---

## Quick Reference

### Minimal Viable AI-CLI

```text
USAGE: tool <query> [options]
OPTIONS: --help, --list, --verbose
BEHAVIOR: Explains defaults and verbose mode
```

Good for: Simple tools

### Standard AI-CLI (Recommended)

```text
USAGE: tool <query> [options]
OPTIONS: --help, --list, --verbose, plus domain-specific flags
BEHAVIOR: Full behavior explanation
EXAMPLES: 2-3 concrete examples
```

Good for: Most agent-oriented tools

### Complete AI-CLI

```text
USAGE: tool <query> [options]
OPTIONS: Comprehensive flag set
BEHAVIOR: Full behavior with edge cases
EXAMPLES: 4+ examples covering use cases
```

Good for: Complex tools

---

## Common Mistakes

### Mistake 1: Incomplete `--help`

❌ **Bad:**
```text
USAGE: tool [options]
OPTIONS: --help, --version
```

**Why bad:** Dead end. No way to discover capabilities.

✅ **Good:**
```text
USAGE: tool <query> [options]
OPTIONS: --list, --verbose, --help
BEHAVIOR: Explains what default shows and when to use flags
EXAMPLES: tool "query", tool --list
```

**Why good:** Self-teaching. Agent can discover everything.

### Mistake 2: Verbose Default Output

❌ **Bad:**
```
📄 file.md (score: 0.15)
   Local:  /abs/path/file.md
   Online: https://example.com/file
   Title:  File Title
   Summary: File summary
   ReadWhen: Context
```

**Why bad:** Token waste. 80% of fields unnecessary.

✅ **Good:**
```
file.md
  Summary: File summary
  ReadWhen: Context
```

**Why good:** Token-efficient. Shows what matters most.

### Mistake 3: Generic Errors

❌ **Bad:**
```text
Error: No results found
```

**Why bad:** Dead end. No recovery.

✅ **Good:**
```text
No results for: "multi word query"
💡 Try splitting: "multi" OR "word" OR "query"
💡 Or use: --threshold 0.5 for looser matching
```

**Why good:** Teaches recovery. Agent isn't stuck.

### Mistake 4: Missing Footer Reminder

❌ **Bad:**
```text
Found 15 results
```

**Why bad:** Agent doesn't know next step.

✅ **Good:**
```text
Found 15 results

REMINDER: Use native read tools for contents; tool for discovery.
Run "tool --help" to refresh your knowledge.
```

**Why good:** Teaches self-recovery. Counteracts attention decay.

---

## Additional Resources

### Case Study

The `ocdocs` CLI demonstrates these principles:
- Self-teaching `--help` with BEHAVIOR section
- Minimal default (path + summary + read_when)
- Verbose mode for full details
- TTY-aware emoji stripping
- Actionable failure suggestions
- Footer reminder with `--help` refresh

### Related Patterns

- **Progressive Disclosure** - Show details on demand
- **Self-Documenting Code** - `--help` is source of truth
- **Fail-Forward Design** - Errors teach next step
- **Trust Loop** - Minimal guidance → agent explores → agent learns
