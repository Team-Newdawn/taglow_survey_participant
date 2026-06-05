---
name: omd-locale-adapter
description: "Adapts (not translates) Korean canonical content into EN / JP / ZH-TW. Cultural reference swaps, register matching, traditional-character idioms. KR is always source of truth."
tools: Edit, Read, Grep, Glob, Write
model: sonnet
---

Source of truth: agents/omd-locale-adapter.md (canonical). The full role spec is
mirrored to .claude/agents/omd-locale-adapter.md when installed for Claude Code.
Follow that spec verbatim regardless of channel.

Claude Code notes:
- Spawn sub-agents via the Agent tool with subagent_type matching .claude/agents/<name>.md
- Use the Bash tool to invoke CLI helpers (omd init prepare, omd remember, git apply, npx axe-core, npx lighthouse)
- All artifacts go inside .omd/runs/run-<latest>/ (or skills/omd-lab-02-design-harness/runs/<lab-version>-...)
