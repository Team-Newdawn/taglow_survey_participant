---
name: taglow-deploy-newdawn-dev
description: Deploy or publish Taglow Survey participant code from local origin/main to Team-Newdawn/taglow_survey_participant dev while keeping VSCode/local default work connected to origin/main. Use when the user asks to push to Newdawn dev, deploy dev, publish staging, or prepare Newdawn dev before a dev-to-main release.
---

# Taglow Newdawn Dev Deploy

Use this skill to publish the current local checkout, normally `main` tracking `origin/main`, to `Team-Newdawn/taglow_survey_participant` branch `dev`.

## Flow

```text
origin/main -> push current commit to newdawn-participant/dev -> PR + merge to newdawn-participant/main -> deploy
```

## Invariants

- `origin` must point at `https://github.com/minchanpark/taglow_survey_participant.git`.
- Local `main` should track `origin/main`; this is the VSCode-facing default branch.
- Keep Team-Newdawn in a separate remote named `newdawn-participant`.
- `newdawn-participant` must point at `https://github.com/Team-Newdawn/taglow_survey_participant.git`.
- Push deployment code to `newdawn-participant/dev`.
- Do not push directly to `newdawn-participant/main`.
- Do not change branch upstreams or VSCode-facing defaults away from `origin/main`.
- Treat `newdawn-participant/main` as production.
- Never force-push unless the user explicitly approves it after seeing the divergence.

## Preflight

Check remotes, branch, and worktree:

```bash
git remote -v
git remote get-url origin
git remote get-url newdawn-participant || git remote add newdawn-participant https://github.com/Team-Newdawn/taglow_survey_participant.git
git fetch origin
git fetch newdawn-participant
git branch --set-upstream-to=origin/main main
git status --short --branch
git branch -vv
```

Stop if:

- `origin` is not `https://github.com/minchanpark/taglow_survey_participant.git`.
- `newdawn-participant` points anywhere other than `https://github.com/Team-Newdawn/taglow_survey_participant.git`.

If there are uncommitted changes, inspect the diff and either commit the intended changes or ask the user what belongs in the deploy. Do not silently stage unrelated files such as `.DS_Store`.

## Validate

Run the normal project checks before pushing:

```bash
pnpm check:types
pnpm test
pnpm build
```

If checks fail, fix the issue or report the blocker. Do not deploy a failing build unless the user explicitly asks to bypass checks.

## Push To Newdawn Dev

Fetch and inspect the deployment branch:

```bash
git fetch origin main
git fetch newdawn-participant main dev
git log --oneline --decorate --left-right --graph newdawn-participant/dev...HEAD
```

If `newdawn-participant/dev` has commits not in `HEAD`, stop and inspect. Prefer merging or rebasing intentionally over overwriting.

Push the current commit to Newdawn dev without changing local upstream:

```bash
git push newdawn-participant HEAD:dev
```

Verify:

```bash
git ls-remote --heads newdawn-participant dev main
git status --short --branch
```

The final status should still show local `main` tracking `origin/main`.

## Optional PR To Main

When the user asks to release, deploy production, or open a PR to main, use `$taglow-release-newdawn-main`.

## Final Response

Summarize:

- local branch and upstream
- `origin` URL
- `newdawn-participant` URL
- pushed commit SHA
- validation commands run
- PR URL, if created
