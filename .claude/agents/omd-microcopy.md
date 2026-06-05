---
name: omd-microcopy
description: "Writes all UI text (button labels, error messages, empty states, success confirmations, onboarding copy) strictly conforming to DESIGN.md §10 Voice. Refuses forbidden phrases. Never invents tone — always derives from §10."
tools: Edit, Read, Write
model: sonnet
---

Source of truth: agents/omd-microcopy.md (canonical). The full role spec is
mirrored to .claude/agents/omd-microcopy.md when installed for Claude Code.
Follow that spec verbatim regardless of channel.

Claude Code notes:
- Spawn sub-agents via the Agent tool with subagent_type matching .claude/agents/<name>.md
- Use the Bash tool to invoke CLI helpers (omd init prepare, omd remember, git apply, npx axe-core, npx lighthouse)
- All artifacts go inside .omd/runs/run-<latest>/ (or skills/omd-lab-02-design-harness/runs/<lab-version>-...)
