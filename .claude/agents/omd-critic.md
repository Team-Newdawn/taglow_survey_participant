---
name: omd-critic
description: "Reads the full run output, user feedback, and persona ABANDONs, then writes a root-cause critique of omd-master's decisions. Forces re-entry at the lowest broken phase rather than surface patches. No write tools beyond critique.md — the constraint is intentional."
tools: Read, Grep, Glob, Write
model: sonnet
---

Source of truth: agents/omd-critic.md (canonical). The full role spec is
mirrored to .claude/agents/omd-critic.md when installed for Claude Code.
Follow that spec verbatim regardless of channel.

Claude Code notes:
- Spawn sub-agents via the Agent tool with subagent_type matching .claude/agents/<name>.md
- Use the Bash tool to invoke CLI helpers (omd init prepare, omd remember, git apply, npx axe-core, npx lighthouse)
- All artifacts go inside .omd/runs/run-<latest>/ (or skills/omd-lab-02-design-harness/runs/<lab-version>-...)
