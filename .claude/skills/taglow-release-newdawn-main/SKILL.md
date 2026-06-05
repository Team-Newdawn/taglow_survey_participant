---
name: taglow-release-newdawn-main
description: Create, inspect, and merge the Team-Newdawn/taglow_survey_participant pull request from dev to main for production release while keeping origin/minchanpark as the local default remote. Use when the user asks to release Newdawn main, open a dev-to-main PR, merge dev into main, deploy production, or finish the Newdawn release after dev has been pushed.
---

# Taglow Newdawn Main Release

Use this skill to promote `Team-Newdawn/taglow_survey_participant` from `dev` to `main` through a pull request. This is the production release step after `$taglow-deploy-newdawn-dev`.

## Invariants

- Keep `origin` pointing at `https://github.com/minchanpark/taglow_survey_participant.git`.
- Keep Team-Newdawn in a separate remote named `newdawn-participant`.
- Treat `newdawn-participant/main` as production.
- Never push directly to `newdawn-participant/main`.
- Merge only through a GitHub PR from `dev` to `main`.
- Do not change local branch upstreams or VSCode-facing Git defaults.
- Do not force-push or bypass branch protection.

## Preflight

Verify tools, auth, remotes, and repository state:

```bash
gh --version
gh auth status
git remote -v
git remote get-url origin
git remote get-url newdawn-participant || git remote add newdawn-participant https://github.com/Team-Newdawn/taglow_survey_participant.git
gh repo view Team-Newdawn/taglow_survey_participant --json defaultBranchRef,nameWithOwner,url
```

Stop if:

- `origin` is not `https://github.com/minchanpark/taglow_survey_participant.git`.
- `newdawn-participant` points anywhere other than `https://github.com/Team-Newdawn/taglow_survey_participant.git`.
- `gh auth status` is not authenticated.
- The default branch is not `main`.

## Inspect Diff

Fetch the release branches and inspect the remote-only diff:

```bash
git fetch newdawn-participant main dev
git log --oneline --decorate --left-right --graph newdawn-participant/main...newdawn-participant/dev
git diff --stat newdawn-participant/main...newdawn-participant/dev
```

If there are no commits on `dev` ahead of `main`, report that there is nothing to release and stop.

If the log shows commits on `main` that are not in `dev`, do not stop solely for that reason. Previous PR merge commits can make `main` appear ahead while the content diff is still clean. Note the divergence, continue to PR inspection, and let GitHub's mergeability state decide. Stop only if the PR reports conflicts or branch protection blockers.

## Create Or Reuse PR

Check for an existing open PR:

```bash
gh pr list \
  --repo Team-Newdawn/taglow_survey_participant \
  --base main \
  --head dev \
  --state open \
  --json number,title,url,mergeStateStatus,isDraft
```

If an open PR exists, reuse it. If not, create one:

```bash
gh pr create \
  --repo Team-Newdawn/taglow_survey_participant \
  --base main \
  --head dev \
  --title "Release participant dev to main" \
  --body "$(cat <<'EOF'
## Summary
- Promote the current Team-Newdawn dev branch to main.

## Validation
- Confirmed dev/main diff before release.
- Confirmed branch protection requires PR flow.
EOF
)"
```

After creation, fetch the PR details:

```bash
gh pr view <number-or-url> \
  --repo Team-Newdawn/taglow_survey_participant \
  --json number,title,url,mergeStateStatus,isDraft,reviewDecision,statusCheckRollup
```

## Merge

Merge only when the user explicitly asked to merge/release, not when they only asked to open a PR.

Before merging:

- Ensure the PR is not draft.
- Ensure `mergeStateStatus` is not `DIRTY` or `BLOCKED`.
- If `mergeStateStatus` is `UNKNOWN`, wait briefly and re-check once before deciding.
- If status checks exist, ensure required checks are passing.
- If GitHub reports branch protection blockers, stop and report them.

Merge with squash by default:

```bash
gh pr merge <number-or-url> \
  --repo Team-Newdawn/taglow_survey_participant \
  --squash \
  --delete-branch=false
```

Keep `dev` after merge because it is the ongoing deployment branch.

## Verify

After merge:

```bash
git fetch newdawn-participant main dev
git ls-remote --heads newdawn-participant dev main
gh pr view <number-or-url> --repo Team-Newdawn/taglow_survey_participant --json state,mergedAt,mergeCommit,url
git status --short --branch
```

Local status should still show the user's local branch/upstream connected to `origin`, not `newdawn-participant`.

## Final Response

Summarize:

- PR URL and final state
- merge method used, if merged
- `newdawn-participant/main` commit after release
- `newdawn-participant/dev` commit after release
- local branch/upstream
- any blockers or checks that prevented merge
