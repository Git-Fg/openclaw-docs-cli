---
name: ai-cli
description: This skill should be used when building or refactoring CLI tools for AI agent consumption. Use when the user asks to "build an agent-friendly CLI", "optimize CLI for AI", "make CLI self-teaching", "design CLI for LLMs", "create agent-oriented tool output", or mentions token-efficient output, semantic density, agent discovery patterns, zero-transformation returns, or agent-usable paths.
metadata:
  author: Git-FG
  version: "1.0"
---

# AI-Agent CLI Design Skill

Build CLI tools that AI agents can discover, understand, and use efficiently without prior training.

## About AI-Agent CLI Design

Traditional CLI design optimizes for human users with muscle memory and intuition. AI-agent CLI design optimizes for self-teaching, token efficiency, and failure recovery.

### What This Skill Provides

1. **Zero-Transformation Returns** - Everything agents receive must be immediately usable without manipulation
2. **Self-Teaching Pattern** - `--help` as complete manual; agents learn by reading, not doing
3. **Semantic Density** - Natural language text, not JSON; matches LLM native parsing
4. **Failure Recovery** - Actionable next steps instead of error codes
5. **Attention Management** - Counteract lost-in-the-middle with reminders
6. **Token-Efficient Output** - No spammy progress, no interactive elements
7. **Agent-Perspective Testing** - Test that another agent can use your output without translation

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

## The Core Principle: Zero-Transformation Returns

**Golden rule:** Everything returned to an agent must be immediately usable without mental translation or code manipulation.

### What This Means

| ❌ Wrong | ✅ Right |
|---------|----------|
| Paths relative to internal dirs | Paths relative to `process.cwd()` |
| IDs that require separate lookup | Full objects or actionable references |
| Encoded data needing parse | Natural language or immediately usable format |
| Progress every 1% (100+ updates) | Progress every 10% (~10 updates max) |
| Decorative emojis (5+) | 2 emojis max (warnings/reminders only) |

### Why This Matters

Agents don't "interpret" output like humans do. When they receive something, they either:

1. **Use it directly** → Efficient, token-saving, flows smoothly
2. **Transform it** → Wastes tokens, error-prone, breaks flow
3. **Get stuck** → Dead end, requires user intervention

If you're returning something that requires the agent to think *"now I need to..."* — you've failed.

### The Test

Can you copy-paste the output directly into another tool/action? If no, add transformation or change the format.

### Examples

```text
# ❌ Bad - requires mental work
Path: gateway/authentication.md
# Agent thinks: where is this? do I prepend docs/?

# ✅ Good - immediately usable
Path: node_modules/openclaw/docs/gateway/authentication.md
# Agent thinks: paste into Read tool, done

# ❌ Bad - encoded reference
Doc ID: auth_12345
# Agent must: run another command to get the path

# ✅ Good - complete information
Path: node_modules/.../authentication.md
ID: auth_12345
# Agent has: everything needed
```

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

## 2. The `--help` Contract

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

## 3. Semantic Density

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

## 4. Token-Efficient Output & Visual Elements

**The Principle:** Every token spent on output should either (a) enable action or (b) prevent failure. Decoration is waste.

### The Pattern

```text
# ❌ Bad - spammy (100s of updates, emoji soup)
Processing: [████████████████████] 100% (2:45)
🔍💡📄⚠️🚨 Found 15 results

# ✅ Good - meaningful (~10 updates max, 2 emojis)
Progress: 10% (~25s remaining)...
Progress: 20% (~50s remaining)...
⚠️ Found 15 results. Try: split query, lower threshold
```

### Core Rules

**Progress indicators:**
- Show every 10% max (~10 updates total)
- Include time estimate for predictability
- Enough to detect early issues, not enough to spam

**Visual elements:**
- 2 emojis max: warnings (⚠️) and critical reminders only
- No animations: spinners, bouncing dots, progress bars
- Colors are fine: for human readability, but always use labels too

**Interactive elements:**
- None. No prompts, no "press any key", no blocking input

**DO:**
- Use fixed labels as parsing anchors
- Show meaningful progress milestones
- Keep output under 1KB per operation
- Reserve emojis for warnings/reminders

**DON'T:**
- Use tqdm-style progress bars (updates every 1%)
- Require interactive input of any kind
- Use decorative emojis (🔍, 📄, 🚨, etc.)
- Rely on color alone for meaning

---

## 5. Agent-Usable Paths

Paths returned to agents must be directly usable with Read/Glob tools - no mental translation required.

### The Pattern

```text
# ❌ Bad - relative to internal dir (useless to agent)
docs/gateway/authentication.md

# ✅ Good - relative to process.cwd() (directly usable)
node_modules/openclaw/docs/gateway/authentication.md
```

### Three Path Types to Understand

| Type | Example | Purpose |
|------|---------|---------|
| `cwdRelative` | `node_modules/.../file.md` | Default output, --list, agent consumption |
| `internalRelative` | `docs/file.md` | Expanded mode reference only |
| `absolute` | `/Users/.../file.md` | Expanded mode primary entry |

### Core Rules

**Always use cwd-relative paths by default:**
- Paths from `process.cwd()` are directly usable by agents
- No mental translation or path manipulation required
- Works with native Read/Glob tools immediately

**Consistency across all modes:**
- `--list` output must match default search output format
- All "discovery" modes use the same path format
- Expanded mode can show absolute as primary + internal-relative as reference

**DO:**
- Use `relative(process.cwd(), filePath)` for default output
- Keep `--list` and search output in the same format
- Test by copying paths directly to Read tool
- Show absolute path in expanded mode with internal-relative labeled

**DON'T:**
- Show paths relative to internal directories
- Require agents to construct paths mentally
- Mix path formats across different modes
- Return paths that can't be used without modification

---

## 6. Actionable Failures (The Pivot)

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

## 7. Footer Reminder Pattern

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
- Keep output minimal (token-efficient)

**DON'T:**
- Make reminder verbose (keep under 2-3 lines)
- Include tool-specific implementation details
- Skip the `--help` refresh option

---

## 8. AGENTS.md Integration

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

## 9. Testing: The Agent Perspective

**The Principle:** Don't just test that it works—test that ANOTHER AGENT can use it effectively.

### The Workflow Test

Can you complete this flow without thinking?

```
1. Run --help
   → Can you understand everything without external docs?
   → Does it explain WHEN to use each flag, not just WHAT they do?

2. Run a basic query
   → Is the output immediately usable?
   → Can you copy-paste results into another tool/action?

3. Copy a returned path
   → Does it work with Read/Glob tool directly?
   → No mental translation or string manipulation needed?

4. Try a failure case
   → Does it teach you what to do next?
   → Or are you left with "error: not found"?

5. Check --list output
   → Is it consistent with default search output?
   → Same path format, same labels?
```

If any answer is "no," iterate.

### The Token Audit

Count tokens in typical output:

| Output Type | Target | Notes |
|-------------|--------|-------|
| Default result | ~100-200 tokens | Just what's needed 80% of the time |
| Expanded result | ~300-500 tokens | Full details when requested |
| Help text | ~500-800 tokens | Complete reference |
| Progress (per operation) | ~100 tokens max | 10% intervals only |

If any exceed these targets significantly, simplify.

### The Copy-Paste Test

```
1. Get a result from your CLI
2. Copy the path/reference
3. Paste into the appropriate tool (Read, Glob, etc.)
4. Did it work on first try?
```

If you had to modify the copied value, fix your output format.

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
  - Default output: cwd-relative path + summary + read_when (token-efficient)
  - Use --verbose for absolute path, urls, score, title
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
✅ No spammy progress indicators (10% intervals max)
✅ No interactive elements
✅ Return agent-usable paths (cwd-relative)
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
❌ Return paths relative to internal dirs (not agent-usable)
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

**Agent-Usable Paths:**
- [ ] Paths use cwd-relative format (from process.cwd())
- [ ] `--list` output matches default search format
- [ ] Paths work directly with Read/Glob tools
- [ ] Expanded mode shows absolute + internal-relative

**Token-Efficient Output:**
- [ ] Progress shown at 10% intervals max (not spammy)
- [ ] Includes time estimates for progress
- [ ] No interactive elements (prompts, spinners)

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
- [ ] Output is token-efficient (no spammy progress)
- [ ] No interactive elements that block automation
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
- Minimal default (cwd-relative path with node_modules/ + summary + read_when)
- Verbose mode for absolute path, docs-relative path, urls, score, title
- Token-efficient output (no spammy progress, 2 emojis max)
- Actionable failure suggestions
- Footer reminder with `--help` refresh

### Related Patterns

- **Progressive Disclosure** - Show details on demand
- **Self-Documenting Code** - `--help` is source of truth
- **Fail-Forward Design** - Errors teach next step
- **Trust Loop** - Minimal guidance → agent explores → agent learns
