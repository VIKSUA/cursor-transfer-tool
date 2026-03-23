# Cursor Transfer Tool

`cursor-transfer-tool` is a small Node.js utility for moving a minimal Cursor setup between machines without copying caches, chat history, or other large local state.

The project is designed around two commands:

- `collect`: build a portable transfer package on the source machine
- `apply`: restore the package on the target machine

Additional helper commands:

- `inspect`: show what was collected into the transfer package
- `check`: validate that the transfer package is present and the target paths are usable

## What It Transfers

- `User/settings.json`
- `User/keybindings.json`
- `.cursor/mcp.json`
- a safe allowlist export of selected layout and sidebar keys from `User/globalStorage/state.vscdb`
- a small safe subset of `User/globalStorage/storage.json`

## What It Does Not Transfer

- caches
- logs
- `workspaceStorage`
- `History`
- the full `state.vscdb` database
- prompt history
- unrelated sensitive local state

## Requirements

- Node.js 20 or newer

## Installation

```bash
npm install
```

## Project Structure

- `package.json`: package metadata and CLI scripts
- `cursor-transfer.config.json`: source, target, and package paths
- `src/cli.js`: command entry point
- `src/collect.js`: transfer package builder
- `src/apply.js`: package restore logic
- `src/sqlite.js`: safe SQLite key export/import for layout state
- `transfer-package/`: generated output folder, excluded from git

## Configuration

Edit `cursor-transfer.config.json` only if you need non-default paths.

Windows environment variables are supported, for example:

- `%APPDATA%`
- `%USERPROFILE%`

Main source paths:

- `source.roamingCursorDir`
- `source.cursorHomeDir`
- `source.mcpConfigPath`

Main target paths:

- `target.roamingCursorDir`
- `target.cursorHomeDir`
- `target.mcpConfigPath`

Output path:

- `package.outputDir`

Behavior flags:

- `options.includeWindowState`
- `options.overwriteExistingFiles`
- `options.createMissingStateDb`

## Default Setup

The default config is already aimed at the standard Windows Cursor installation layout.

That means the common workflow can stay very simple:

1. Clone this repository anywhere on the new machine
2. Run `npm install`
3. Copy `transfer-package/` from the source machine
4. Run `npm run check`
5. Run `npm run apply`

You do not need to place the repository inside the Cursor directories.
The tool reads the default Cursor paths from the config and applies the transfer package to those locations.

## Usage

On the source machine:

```bash
npm run collect
```

This creates `transfer-package/`.

To inspect the generated package:

```bash
npm run inspect
```

To validate the target machine before applying:

```bash
npm run check
```

On the target machine, after copying the project and `transfer-package/`:

```bash
npm run apply
```

## Behavior Notes

- The tool writes only an allowlist of layout-related keys back into `state.vscdb`.
- If `state.vscdb` does not exist yet, the tool can create a minimal database.
- MCP configuration is restored from `.cursor/mcp.json`.
- Absolute paths inside `mcp.json` are remapped from source paths to target paths during `apply`.
- `check` does not modify anything. It only validates package files and target path readiness.

## Security Notes

- `mcp.json` may contain secrets such as API keys.
- Keep this repository private if you store a real transfer package or real MCP config in it.
- `transfer-package/` and `node_modules/` are intentionally ignored by git.

## Development

Available scripts:

```bash
npm run collect
npm run inspect
npm run check
npm run apply
```

## Commit Convention

This repository uses Conventional Commits.

Preferred format:

```text
type(scope): short summary
```

Examples:

- `feat(cli): add package inspection command`
- `fix(apply): remap MCP absolute paths on restore`
- `docs(readme): clarify default Windows setup`
- `refactor(sqlite): simplify state key upsert flow`

Common types:

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`

When changing behavior, keep `README.md` and `AGENTS.md` in sync.
