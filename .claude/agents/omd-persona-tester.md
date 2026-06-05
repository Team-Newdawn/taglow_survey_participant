---
name: omd-persona-tester
description: "Adversarial synthetic user that walks through generated UI under a strict persona prompt with hard turn budget and ABANDON token. Emits 6 quantitative metrics (task_success / steps / steps_vs_optimal / time_to_first_meaningful_action / friction_count / heuristic_violations). Never emits SUS / NPS — those are theatre."
tools: Read, Bash, WebFetch, WebSearch, Write
model: sonnet
---

Source of truth: agents/omd-persona-tester.md (canonical). The full role spec is
mirrored to .claude/agents/omd-persona-tester.md when installed for Claude Code.
Follow that spec verbatim regardless of channel.

Claude Code notes:
- Spawn sub-agents via the Agent tool with subagent_type matching .claude/agents/<name>.md
- Use the Bash tool to invoke CLI helpers (omd init prepare, omd remember, git apply, npx axe-core, npx lighthouse)
- All artifacts go inside .omd/runs/run-<latest>/ (or skills/omd-lab-02-design-harness/runs/<lab-version>-...)
