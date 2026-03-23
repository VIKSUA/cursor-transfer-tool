import fs from "node:fs/promises";
import path from "node:path";
import { FILES_TO_COPY } from "./constants.js";
import { copyFileEnsured, ensureDir, fileExists, readJson, writeJson } from "./fs-utils.js";
import { upsertStateKeys } from "./sqlite.js";

async function maybeCopy(packageDir, relativePackagePath, targetPath, overwriteExistingFiles) {
  const packagePath = path.join(packageDir, relativePackagePath);
  const exists = await fileExists(targetPath);

  if (exists && !overwriteExistingFiles) {
    return {
      skipped: true,
      targetPath
    };
  }

  await copyFileEnsured(packagePath, targetPath);
  return {
    skipped: false,
    targetPath
  };
}

function replacePrefixInsensitive(value, fromPrefix, toPrefix) {
  const normalizedValue = path.normalize(value);
  const normalizedFrom = path.normalize(fromPrefix);
  const normalizedTo = path.normalize(toPrefix);

  if (normalizedValue.toLowerCase().startsWith(normalizedFrom.toLowerCase())) {
    return normalizedTo + normalizedValue.slice(normalizedFrom.length);
  }

  return value;
}

function remapPathStrings(value, config) {
  if (typeof value === "string") {
    let result = value;
    result = replacePrefixInsensitive(result, config.source.roamingCursorDir, config.target.roamingCursorDir);
    result = replacePrefixInsensitive(result, config.source.cursorHomeDir, config.target.cursorHomeDir);
    result = replacePrefixInsensitive(result, config.source.mcpConfigPath, config.target.mcpConfigPath);
    return result;
  }

  if (Array.isArray(value)) {
    return value.map((item) => remapPathStrings(item, config));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, objectValue]) => [key, remapPathStrings(objectValue, config)])
    );
  }

  return value;
}

export async function applyTransfer(config) {
  const packageDir = config.package.outputDir;
  const manifestPath = path.join(packageDir, "manifest.json");
  const manifest = await readJson(manifestPath);
  const actions = [];

  for (const fileDef of FILES_TO_COPY) {
    const targetPath = path.join(config.target.roamingCursorDir, ...fileDef.relativeTarget);
    const relativePackagePath = path.join(...fileDef.relativePackage);
    const result = await maybeCopy(
      packageDir,
      relativePackagePath,
      targetPath,
      config.options.overwriteExistingFiles
    );

    actions.push({
      id: fileDef.id,
      ...result
    });
  }

  const mcpTargetPath = config.target.mcpConfigPath;
  const mcpPackagePath = path.join(packageDir, "files", "cursor-home", "mcp.json");
  const mcpSourceJson = await readJson(mcpPackagePath);
  const mcpTargetJson = remapPathStrings(mcpSourceJson, config);
  await writeJson(mcpTargetPath, mcpTargetJson);
  actions.push({
    id: "mcp",
    skipped: false,
    targetPath: mcpTargetPath
  });

  const stateExportPath = path.join(packageDir, "state", "global-state.json");
  if (await fileExists(stateExportPath)) {
    const stateValues = await readJson(stateExportPath);
    const stateDbPath = path.join(config.target.roamingCursorDir, "User", "globalStorage", "state.vscdb");
    await ensureDir(path.dirname(stateDbPath));
    await upsertStateKeys(stateDbPath, stateValues, config.options.createMissingStateDb);
    actions.push({
      id: "state",
      skipped: false,
      targetPath: stateDbPath,
      appliedKeyCount: Object.keys(stateValues).length
    });
  }

  const storageExportPath = path.join(packageDir, "state", "storage.json");
  if (await fileExists(storageExportPath)) {
    const storageJsonPath = path.join(config.target.roamingCursorDir, "User", "globalStorage", "storage.json");
    const exportedStorage = await readJson(storageExportPath);
    let mergedStorage = exportedStorage;

    if (await fileExists(storageJsonPath)) {
      const existingStorage = await readJson(storageJsonPath);
      mergedStorage = {
        ...existingStorage,
        ...exportedStorage
      };
    }

    await writeJson(storageJsonPath, mergedStorage);
    actions.push({
      id: "storage-json",
      skipped: false,
      targetPath: storageJsonPath
    });
  }

  return {
    packageDir,
    manifest,
    actions
  };
}
