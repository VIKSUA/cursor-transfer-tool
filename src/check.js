import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { FILES_TO_COPY } from "./constants.js";
import { fileExists } from "./fs-utils.js";

async function canAccessDir(dirPath) {
  try {
    await fs.access(dirPath, fsConstants.R_OK | fsConstants.W_OK);
    return true;
  } catch {
    return false;
  }
}

async function findNearestExistingParent(inputPath) {
  let currentPath = path.normalize(inputPath);
  const parsed = path.parse(currentPath);

  while (currentPath && currentPath !== parsed.root) {
    if (await fileExists(currentPath)) {
      return currentPath;
    }

    const nextPath = path.dirname(currentPath);
    if (nextPath === currentPath) {
      break;
    }
    currentPath = nextPath;
  }

  if (await fileExists(parsed.root)) {
    return parsed.root;
  }

  return null;
}

async function describeDirTarget(label, targetPath) {
  if (await fileExists(targetPath)) {
    const writable = await canAccessDir(targetPath);
    return {
      level: writable ? "ok" : "error",
      label,
      blocking: !writable,
      message: writable
        ? `exists: ${targetPath}`
        : `exists but is not writable: ${targetPath}`
    };
  }

  const nearestParent = await findNearestExistingParent(targetPath);
  if (!nearestParent) {
    return {
      level: "error",
      label,
      blocking: true,
      message: `missing and no existing parent directory was found: ${targetPath}`
    };
  }

  const parentWritable = await canAccessDir(nearestParent);
  return {
    level: parentWritable ? "warn" : "error",
    label,
    blocking: !parentWritable,
    message: parentWritable
      ? `will be created under existing parent: ${nearestParent}`
      : `cannot create under non-writable parent: ${nearestParent}`
  };
}

async function describeFileTarget(label, filePath) {
  if (await fileExists(filePath)) {
    try {
      await fs.access(filePath, fsConstants.R_OK | fsConstants.W_OK);
      return {
        level: "ok",
        label,
        blocking: false,
        message: `exists: ${filePath}`
      };
    } catch {
      return {
        level: "error",
        label,
        blocking: true,
        message: `exists but is not writable: ${filePath}`
      };
    }
  }

  return describeDirTarget(label, path.dirname(filePath));
}

export async function checkTarget(config) {
  const packageDir = config.package.outputDir;
  const checks = [];

  const manifestPath = path.join(packageDir, "manifest.json");
  const manifestExists = await fileExists(manifestPath);
  checks.push({
    level: manifestExists ? "ok" : "error",
    label: "transfer package manifest",
    blocking: !manifestExists,
    message: manifestExists
      ? `found: ${manifestPath}`
      : `missing: ${manifestPath}`
  });

  for (const fileDef of FILES_TO_COPY) {
    const packagePath = path.join(packageDir, ...fileDef.relativePackage);
    const exists = await fileExists(packagePath);
    checks.push({
      level: exists ? "ok" : "error",
      label: `package file ${fileDef.id}`,
      blocking: !exists,
      message: exists ? `found: ${packagePath}` : `missing: ${packagePath}`
    });
  }

  const mcpPackagePath = path.join(packageDir, "files", "cursor-home", "mcp.json");
  const mcpPackageExists = await fileExists(mcpPackagePath);
  checks.push({
    level: mcpPackageExists ? "ok" : "error",
    label: "package file mcp",
    blocking: !mcpPackageExists,
    message: mcpPackageExists ? `found: ${mcpPackagePath}` : `missing: ${mcpPackagePath}`
  });

  checks.push(await describeDirTarget("target Cursor roaming directory", config.target.roamingCursorDir));
  checks.push(await describeDirTarget("target Cursor home directory", config.target.cursorHomeDir));
  checks.push(await describeFileTarget("target MCP config location", config.target.mcpConfigPath));

  const stateDbPath = path.join(config.target.roamingCursorDir, "User", "globalStorage", "state.vscdb");
  checks.push(await describeFileTarget("target state database location", stateDbPath));

  const ready = checks.every((check) => !check.blocking);

  return {
    packageDir,
    checks,
    ready
  };
}
