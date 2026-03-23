#!/usr/bin/env node
import { applyTransfer } from "./apply.js";
import { collect } from "./collect.js";
import { loadConfig } from "./config.js";
import { inspectPackage } from "./inspect.js";

function parseArgs(argv) {
  const [, , command, ...rest] = argv;
  let configPath;

  for (let index = 0; index < rest.length; index += 1) {
    if (rest[index] === "--config") {
      configPath = rest[index + 1];
      index += 1;
    }
  }

  return {
    command,
    configPath
  };
}

function printUsage() {
  console.log("Usage:");
  console.log("  cursor-transfer collect [--config path]");
  console.log("  cursor-transfer apply [--config path]");
  console.log("  cursor-transfer inspect [--config path]");
}

async function main() {
  const { command, configPath } = parseArgs(process.argv);

  if (!command || !["collect", "apply", "inspect"].includes(command)) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const config = await loadConfig(configPath);

  if (command === "collect") {
    const result = await collect(config);
    console.log(`Collected transfer package: ${result.packageDir}`);
    console.log(`Copied files: ${result.manifest.files.length}`);
    return;
  }

  if (command === "apply") {
    const result = await applyTransfer(config);
    console.log(`Applied transfer package: ${result.packageDir}`);
    for (const action of result.actions) {
      if (action.skipped) {
        console.log(`- skipped ${action.id}: ${action.targetPath}`);
      } else {
        console.log(`- applied ${action.id}: ${action.targetPath}`);
      }
    }
    return;
  }

  const result = await inspectPackage(config);
  console.log(`Package: ${result.packageDir}`);
  console.log(`Collected at: ${result.manifest.collectedAtUtc}`);
  console.log("Files:");
  for (const file of result.manifest.files) {
    console.log(`- ${file.id}: ${file.packagePath}`);
  }
  console.log(`State keys: ${Object.keys(result.stateValues).length}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
