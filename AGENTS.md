# AGENTS.md

## Purpose

This project exists to transfer a minimal, safe subset of Cursor configuration between machines.

The tool should stay intentionally small and conservative:

- transfer only the files and state required for settings, keybindings, MCP, and layout
- avoid copying caches, history, or large workspace state
- avoid restoring sensitive chat or prompt history

## Core Behavior

The CLI currently exposes three commands:

- `collect`
- `apply`
- `inspect`
- `check`

The main workflow is:

1. Read paths from `cursor-transfer.config.json`
2. Build `transfer-package/` on the source machine
3. Copy the project and generated package to the target machine
4. Run `check` on the target machine
5. Apply the package to the target machine

## File Responsibilities

- `src/cli.js`: argument parsing and command dispatch
- `src/config.js`: config loading and path resolution
- `src/collect.js`: package generation
- `src/apply.js`: package restore logic
- `src/constants.js`: file allowlist and safe state key allowlist
- `src/sqlite.js`: SQLite import/export helpers
- `src/fs-utils.js`: filesystem helpers
- `src/inspect.js`: package inspection
- `src/check.js`: target-machine validation for package presence and path readiness

## Path Policy

- Do not hardcode repository-local absolute paths in documentation.
- Prefer relative file references inside project docs.
- Keep the default runtime behavior based on standard Windows Cursor locations from `cursor-transfer.config.json`.
- The repository itself should remain portable and runnable from any folder.

## Safety Rules

- Do not expand the transfer scope casually.
- Do not add raw `workspaceStorage`, `History`, caches, logs, or full database copies.
- Do not restore prompt history or auth tokens.
- Treat `mcp.json` as sensitive because it may include secrets.
- Keep `transfer-package/` out of git.

## Documentation Rules

- Keep `README.md` fully in English.
- Update `README.md` whenever commands, config shape, or transfer scope changes.
- Update this file when project rules, architecture, or contributor expectations change.

## Commit Rules

- Use Conventional Commits for every commit.
- Preferred format: `type(scope): short summary`
- Use clear scopes when useful, for example: `cli`, `collect`, `apply`, `docs`, `config`, `sqlite`
- Keep the subject line short and imperative.

Examples:

- `feat(collect): export safe Cursor transfer package`
- `fix(apply): remap MCP paths for target machine`
- `docs(agents): document repository contribution rules`

## Change Guidelines

- Prefer zero-dependency or minimal-dependency solutions.
- Keep the CLI stable and explicit.
- Preserve the source/target path remapping behavior for `mcp.json`.
- Preserve the safe allowlist model for database state writes.
- If new transfer targets are added, document why they are safe and necessary.

## Verification

Before finishing meaningful changes, run the relevant commands locally:

```bash
npm run collect
npm run inspect
npm run check
npm run apply
```

If testing against a real Cursor profile is risky, validate with a temporary target directory instead of the live profile.
