---
name: taglow-deploy-newdawn-dev
description: Deploy or publish Taglow Survey participant code to Team-Newdawn/taglow_survey_participant dev while keeping VSCode/local default work connected to origin/minchanpark. Use when the user asks to deploy to Team-Newdawn dev, push Newdawn dev, publish staging, create a dev-to-main PR for Newdawn, or keep origin as the default remote while using Newdawn as a separate deployment target.
---

# Taglow Newdawn Dev Deploy

Use this skill to publish the current Taglow participant checkout to `Team-Newdawn/taglow_survey_participant` without changing the local default Git experience.

## Invariants

- Keep `origin` pointing at `https://github.com/minchanpark/taglow_survey_participant.git`.
- Keep Team-Newdawn in a separate remote named `newdawn-participant`.
- Push deployment code to `newdawn-participant` branch `dev`.
- Do not push directly to `newdawn-participant/main`.
- Do not change branch upstreams or VSCode-facing defaults unless the user explicitly asks.
- Treat `newdawn-participant/main` as production: open a PR from `dev` to `main` when the user asks for production deploy or release.
- Never force-push unless the user explicitly approves it after seeing the divergence.

## Preflight

1. Check remotes:

```bash
git remote -v
git remote get-url origin
git remote get-url newdawn-participant || git remote add newdawn-participant https://github.com/Team-Newdawn/taglow_survey_participant.git
```

2. Confirm `origin` is the personal repo. If it is not, stop and explain before editing remotes.

3. Inspect branch and worktree:

```bash
git status --short --branch
git branch -vv
```

If there are uncommitted changes, inspect the diff and either commit the intended changes or ask the user what belongs in the deploy. Do not silently stage unrelated files.

## Validate

Run the normal project checks before pushing:

```bash
pnpm check:types
pnpm test
pnpm build
```

If checks fail, fix the issue or report the blocker. Do not deploy a failing build unless the user explicitly asks to bypass checks.

## Push To Newdawn Dev

Fetch and verify that the push will be fast-forward or a clean branch update:

```bash
git fetch newdawn-participant main dev
git log --oneline --decorate --left-right --graph newdawn-participant/dev...HEAD
```

If `newdawn-participant/dev` has commits not in `HEAD`, stop and inspect. Prefer merging or rebasing intentionally over overwriting.

Push the current commit to Newdawn dev without changing local upstream:

```bash
git push newdawn-participant HEAD:dev
```

After pushing, verify:

```bash
git ls-remote --heads newdawn-participant dev main
git status --short --branch
```

The final status should still show the user's local branch/upstream as it was before deploy, normally connected to `origin`.

## Optional PR To Main

When the user asks to release, deploy production, or open a PR to main:

```bash
gh pr create \
  --repo Team-Newdawn/taglow_survey_participant \
  --base main \
  --head dev \
  --title "Deploy participant updates" \
  --body "Deploys the current dev branch to main after validation."
```

If a PR already exists, report the existing PR URL instead of creating a duplicate.

## Final Response

Summarize:

- current local branch and upstream
- `origin` URL
- `newdawn-participant` URL
- pushed commit SHA
- validation commands run
- PR URL, if created
