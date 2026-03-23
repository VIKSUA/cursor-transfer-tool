import fs from "node:fs/promises";
import path from "node:path";

function expandWindowsEnv(input) {
  return input.replace(/%([^%]+)%/g, (_, name) => process.env[name] ?? `%${name}%`);
}

function resolveMaybeRelative(baseDir, input) {
  const expanded = expandWindowsEnv(input);
  if (path.isAbsolute(expanded)) {
    return path.normalize(expanded);
  }

  return path.normalize(path.resolve(baseDir, expanded));
}

export async function loadConfig(configPathArg) {
  const configPath = path.resolve(process.cwd(), configPathArg ?? "cursor-transfer.config.json");
  const raw = await fs.readFile(configPath, "utf8");
  const parsed = JSON.parse(raw);
  const baseDir = path.dirname(configPath);

  return {
    configPath,
    baseDir,
    source: {
      roamingCursorDir: resolveMaybeRelative(baseDir, parsed.source.roamingCursorDir),
      cursorHomeDir: resolveMaybeRelative(baseDir, parsed.source.cursorHomeDir),
      mcpConfigPath: resolveMaybeRelative(baseDir, parsed.source.mcpConfigPath)
    },
    target: {
      roamingCursorDir: resolveMaybeRelative(baseDir, parsed.target.roamingCursorDir),
      cursorHomeDir: resolveMaybeRelative(baseDir, parsed.target.cursorHomeDir),
      mcpConfigPath: resolveMaybeRelative(baseDir, parsed.target.mcpConfigPath)
    },
    package: {
      outputDir: resolveMaybeRelative(baseDir, parsed.package.outputDir)
    },
    options: {
      includeWindowState: parsed.options?.includeWindowState !== false,
      overwriteExistingFiles: parsed.options?.overwriteExistingFiles !== false,
      createMissingStateDb: parsed.options?.createMissingStateDb !== false
    }
  };
}
