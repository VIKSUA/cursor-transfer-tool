import path from "node:path";
import { fileExists, readJson } from "./fs-utils.js";

export async function inspectPackage(config) {
  const packageDir = config.package.outputDir;
  const manifestPath = path.join(packageDir, "manifest.json");

  if (!(await fileExists(manifestPath))) {
    throw new Error(`Transfer package not found: ${manifestPath}`);
  }

  const manifest = await readJson(manifestPath);
  const statePath = path.join(packageDir, "state", "global-state.json");
  const stateValues = (await fileExists(statePath)) ? await readJson(statePath) : {};

  return {
    packageDir,
    manifest,
    stateValues
  };
}
