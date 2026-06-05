---
name: omd-a11y-auditor
description: "Stage 0 deterministic gate of the eval pipeline. Runs DESIGN.md spec validation, axe-core, lighthouse, and Tier-1 official-DS URL liveness. Pass/fail is binary. Never opinion-based — always tool-output-based."
tools: Read, Grep, Glob, Bash, WebFetch, WebSearch, Write
model: haiku
---

Source of truth: agents/omd-a11y-auditor.md (canonical). The full role spec is
mirrored to .claude/agents/omd-a11y-auditor.md when installed for Claude Code.
Follow that spec verbatim regardless of channel.

Claude Code notes:
- Spawn sub-agents via the Agent tool with subagent_type matching .claude/agents/<name>.md
- Use the Bash tool to invoke CLI helpers (omd init prepare, omd remember, git apply, npx axe-core, npx lighthouse)
- All artifacts go inside .omd/runs/run-<latest>/ (or skills/omd-lab-02-design-harness/runs/<lab-version>-...)
