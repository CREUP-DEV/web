# CREUP Web — Claude Code

Project conventions, architecture, the helpers to reuse and the PR checklist live in
[AGENTS.md](./AGENTS.md). Read it before changing code: it is the source of truth, and where
anything here disagrees with it, AGENTS.md wins. Deployment is in [DEPLOYMENT.md](./DEPLOYMENT.md);
local setup and the ops scripts in [README.md](./README.md).

## Working rules

- Do what has been asked; nothing more, nothing less.
- Prefer editing existing files to creating new ones, and don't create documentation files unless asked.
- Don't leave scratch files or one-off scripts in the repository.
- Read a file before editing it.
- Never commit secrets, credentials or `.env` files.
- Never add a `Co-Authored-By` trailer to commits unless `.claude/settings.json` sets `attribution.commit`.
- Validate input at system boundaries.

## Tooling

- Package manager: **pnpm**, never npm or yarn.
- There is no test suite yet. Before committing, run what CI runs. `pnpm verify` runs lint,
  typecheck and the i18n check side by side after one `nuxt prepare` (`VERIFY_SERIAL=1` runs them
  one at a time); the build goes after it:

  ```bash
  pnpm verify && pnpm build
  ```

- The working copy is shared between Linux and Windows. `node_modules` holds one platform's
  native binaries, so after switching OS it needs `pnpm install` (on Windows, delete
  `node_modules/.package-map.json` and `node_modules/.pnpm-workspace-state-v1.json` first: the
  Btrfs driver marks dotfiles hidden and pnpm cannot overwrite them).
- `deploy.sh`, `rollback.sh` and `clone-prod-db.sh` run from Git Bash or WSL.
