---
name: omd-designer-review
description: "Visual + brand consistency reviewer. Audits HTML/MD/JSX against the brand DESIGN.md across typography, color budget, radius scale, component states, mobile responsiveness, spacing. Outputs BLOCK / WARN / FYI with line refs. Read-only advisory — never modifies artifacts."
tools: Read, Grep, Glob, Bash
model: sonnet
---

Source of truth: agents/omd-designer-review.md (canonical). The full role spec is
mirrored to .claude/agents/omd-designer-review.md when installed for Claude Code.
Follow that spec verbatim regardless of channel.

Claude Code notes:
- Spawn sub-agents via the Agent tool with subagent_type matching .claude/agents/<name>.md
- Use the Bash tool to invoke CLI helpers (omd init prepare, omd remember, git apply, npx axe-core, npx lighthouse)
- All artifacts go inside .omd/runs/run-<latest>/ (or skills/omd-lab-02-design-harness/runs/<lab-version>-...)
