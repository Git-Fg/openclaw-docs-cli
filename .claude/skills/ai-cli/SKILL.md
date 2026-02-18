---
name: ai-cli
description: Guide for building and auditing CLI tools optimized for AI agent consumption. Use when building or refactoring CLIs for agents, when users mention "agent-friendly CLI", "optimize CLI for AI", "token-efficient output", or when auditing CLI tools for agent usability. Key principles: zero-transformation returns, self-teaching --help, semantic density (text over JSON), and teaching forgotten patterns.
license: MIT
---

# AI-Agent CLI Design Guide

CLI tools optimized for AI agents differ from traditional CLIs. Agents learn by reading, not doing. They have token budgets, not muscle memory. They need discoverability, not memorization.

## Core Principles

### Zero-Transformation Returns

**Golden rule:** Everything returned to an agent must be immediately usable without mental translation or code manipulation.

| ❌ Wrong | ✅ Right |
|---------|----------|
| Paths relative to internal dirs | Paths relative to `process.cwd()` |
| IDs requiring separate lookup | Full objects or actionable references |
| Encoded data needing parse | Natural language or immediately usable format |
| Progress every 1% (100+ updates) | Progress every 10% (~10 updates max) |

### Self-Teaching --help

`--help` must be a complete manual. Agents read it to learn capabilities—assume nothing else exists.

**Required sections:**
- **USAGE**: Shows command pattern with `<query>` or positional placeholders
- **OPTIONS**: All flags with brief descriptions of WHEN to use them
- **BEHAVIOR**: What default output shows and WHY, how flags change behavior
- **EXAMPLES**: 2-4 concrete usage examples

**The Discovery Pattern:**
Agents need to discover what exists before querying. Always provide a discovery flag:
```text
--list          List all items (discovery phase)
--ls            Enumerate resources
--show-all      Display everything the tool knows about
```

**DO:**
- Include BEHAVIOR section explaining defaults + alternatives
- Provide EXAMPLES with concrete commands
- Explain WHY behind each option (not just WHAT)
- Make --help self-contained (no external docs needed)

**DON'T:**
- Assume agents know flag names imply purpose
- Require external documentation to understand usage
- Omit explanation of what default output shows

### Semantic Density

Natural language text > JSON for agent consumption. LLMs are trained on text—JSON adds structural overhead without semantic value.

**Text format: ~40% fewer tokens than JSON**

```text
# Text: agent understands naturally
OAuth (0.15) → score understood through context

# JSON: more tokens, no semantic benefit
{"path": "oauth.md", "score": 0.15} → parsing overhead
```

**Fixed Labels as Parsing Anchors:**

Labels act as anchors—names that stay consistent even if position changes.

```text
# Agents parse by label, not position
Path:     getting-started.md
Score:    0.15
Summary:  How to get started
ReadWhen: You are new to the project
```

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

### Progressive Disclosure

Minimal default, opt-in verbosity. Agents need the right information 80% of the time; details when requested.

```text
# Default (what agents need most):
📄 OAuth
  local_path: node_modules/openclaw/docs/concepts/oauth.md
  summary: OAuth token exchange and storage

# Expanded (when requested):
Absolute path + docs_relative + online url + score
```

## Common Patterns

### Discovery Flag

Agents need to discover what exists before querying. Always provide a discovery flag:

```text
--list          List all items (discovery phase)
--ls            Enumerate resources
--show-all      Display everything the tool knows about
```

Name doesn't matter. Purpose matters: **discovery before search**.

### Actionable Failures

When things go wrong, teach the next step—not just "error."

```text
# ❌ Bad - dead end
Error: No results found

# ✅ Good - forward momentum
No results for: "multi word query"
Try splitting: "multi" OR "word" OR "query"
Or use: --threshold 0.5 for looser matching
```

**Failure modes to handle:**

| Situation | Teach This |
|-----------|------------|
| No results | Split terms, broaden search, try discovery flag |
| Permission denied | Check permissions, try with elevation |
| Missing dependency | Install command, where to get it |
| Ambiguous input | Show top matches, ask to clarify |
| Invalid format | Show expected format, provide example |

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

### Emoji Usage: Attention Markers

Emojis serve as "turning points" in LLM attention mechanisms. Use 2-3 emojis max to mark semantic transitions.

**DO use:** ⚠️ (warnings), 📄 (documents), ✅ (success), ❌ (errors) - common in training data
**DON'T use:** Emoji soup (5+), obscure emojis, decorative-only emojis

```text
# ✅ Good - emojis mark semantic categories
📄 OAuth
  local_path: node_modules/openclaw/docs/concepts/oauth.md
⚠️ No results. Try: split query, lower threshold

# ❌ Bad - emoji soup
🔍💡📄⚠️🚨 Found 15 results
```

### Agent-Usable Paths

Paths returned must work directly with Read/Glob tools—no mental translation.

```text
# ❌ Wrong - requires mental work
gateway/authentication.md
# Agent thinks: where is this? do I prepend docs/?

# ✅ Right - immediately usable
node_modules/openclaw/docs/concepts/oauth.md
# Agent thinks: paste into Read tool, done
```

### Footer Reminder: Teach Forgotten Patterns

Agents "forget" their instructions over time. Remind them of capabilities they might miss, not what they just did.

```text
# ❌ Bad - tells them what they already know
REMINDER: This tool is for discovery, not reading.

# ✅ Good - teaches forgotten patterns
⚠️ REMINDER: Use native Read tool for full file contents. Run "tool --help" to see all options.
```

### AGENTS.md: Proactive Teaching

AGENTS.md is read at conversation START—before agents form their approach. Footer reminders come too late.

```markdown
## For AI Agents

<TOOL> CLI - optimized for AI agent consumption.

**First step:** Run `<tool> --help` to learn capabilities.

**Usage:** Execute the simple, full CLI (no & or pipe syntax)
- Example: `<tool> "query"` → shows <default output>

**TIPS:**
- Use <verbose-flag> for <extra-info>
- Read files using native Read tool for full contents (not cat)
```

## Output Format Best Practices

### Labeled Fields > Positional Parsing

Agents parse by label, not position. Labels act as anchors.

```text
# ✅ Good - labeled fields
local_path: node_modules/openclaw/docs/concepts/oauth.md
summary: OAuth token exchange
read_when: You want to understand OAuth

# ❌ Bad - positional (brittle)
node_modules/openclaw/docs/concepts/oauth.md
OAuth token exchange
You want to understand OAuth
```

### Two Path Types

| Type | Example | Purpose |
|------|---------|---------|
| `cwdRelative` | `node_modules/.../file.md` | Default output, agent consumption |
| `internalRelative` | `concepts/file.md` | Reference only, expanded mode |
| `absolute` | `/Users/.../file.md` | Expanded mode primary |

## Real Example: ocdocs

### Default Output
```text
📄 OAuth
  local_path: node_modules/openclaw/docs/concepts/oauth.md
  summary: OAuth in OpenClaw: token exchange, storage, and multi-account patterns
  read_when: You want to understand OpenClaw OAuth end-to-end

Found 1 result

⚠️ REMINDER: Use native Read tool for full file contents. Run "ocdocs --help" to see all options.
```

### Expanded Output
```text
/Users/felix/.../node_modules/openclaw/docs/concepts/oauth.md (score: 1.00)
   docs_relative: concepts/oauth.md
   online: https://docs.openclaw.ai/concepts/oauth
   title: OAuth
   summary: OAuth in OpenClaw: token exchange, storage, and multi-account patterns
```

### Help Text
```text
ocdocs v3.0.0 - OpenClaw Documentation Search

USAGE: ocdocs <query> [options]

OPTIONS:
  --list          List all documents (no search)
  --limit N       Max results (default: 20)
  --threshold T   Fuzzy threshold 0-1 (default: 0.35)
  --expand        Show all fields (urls, score, title)
  --help          Show this help

SEARCH BEHAVIOR:
  - Default output shows: 📄 title + local_path + summary + read_when
  - Use --expand for absolute path, docs_relative, online url, score
  - Multi-word queries: Automatically splits and recombines if no match

EXAMPLES:
  ocdocs "oauth"           # Search for OAuth documentation
  ocdocs "webhook config"   # Find webhook configuration docs
  ocdocs "agent" --limit 3  # Get top 3 results about agents
```

## Auditing Checklist

Use this when reviewing existing CLIs for agent compatibility:

**[ ] Self-teaching --help**
- Complete manual without external docs?
- Explains WHY behind each option?
- Includes BEHAVIOR section?
- Has EXAMPLES section?

**[ ] Zero-transformation output**
- Can results be used immediately (no transformation)?
- Are paths usable with Read/Glob directly?
- Fixed labels as parsing anchors?

**[ ] Token-efficient**
- Default output minimal (80% case)?
- Progress at 10% intervals max?
- 2-3 emojis max (as attention markers)?

**[ ] Teaches forgotten patterns**
- Footer reminder mentions --help?
- Promotes native Read tool over shell commands?
- Emphasizes full content access over previews?

**[ ] No interactive elements**
- No prompts requiring keyboard input?
- No spinners or animations?
- No color-only differentiation (uses labels)?

## Best Practices Summary

**DO:**
- Make `--help` a complete self-contained manual
- Explain WHY behind each option, not just WHAT
- Include BEHAVIOR section in `--help`
- Default to minimal output, provide verbose flag
- Use natural language text format
- Use fixed labels as parsing anchors
- No spammy progress indicators (10% intervals max)
- No interactive elements
- Return agent-usable paths (cwd-relative)
- Include actionable next steps on failures
- Add footer reminder teaching `--help` self-recovery
- Include AGENTS.md section in README
- Trust agents to read and understand

**DON'T:**
- Assume prior knowledge in `--help`
- Require external documentation
- Show all fields by default (token waste)
- Use JSON output unless requested
- Use positional parsing (brittle)
- Return paths relative to internal dirs (not agent-usable)
- Return generic errors without recovery suggestions
- Make footer reminder verbose
- Duplicate `--help` in AGENTS.md
- Prescribe specific flag names (teach patterns)

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
Try splitting: "multi" OR "word" OR "query"
Or use: --threshold 0.5 for looser matching
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

### Mistake 5: Non-Agent-Usable Paths

❌ **Bad:**
```text
docs/gateway/auth.md
```

**Why bad:** Agent must mentally construct full path.

✅ **Good:**
```text
node_modules/openclaw/docs/gateway/auth.md
```

**Why good:** Zero-transformation. Paste into Read tool directly.
