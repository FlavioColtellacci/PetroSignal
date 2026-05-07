import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function normalize(input) {
  return input.replace(/\/+/g, "/");
}

function hasMatchingProcess(command) {
  const normalizedCommand = normalize(command);
  const normalizedRepo = normalize(repoRoot);
  const isSameRepo = normalizedCommand.includes(normalizedRepo);
  const isNextDevCommand =
    normalizedCommand.includes("next dev") ||
    normalizedCommand.includes("next-server");

  return isSameRepo && isNextDevCommand;
}

try {
  const output = execSync("ps -axo pid,args", { encoding: "utf8" });
  const lines = output.split("\n").slice(1).filter(Boolean);

  const existing = lines
    .map((line) => line.trim())
    .map((line) => {
      const firstSpace = line.indexOf(" ");
      if (firstSpace === -1) {
        return null;
      }
      const pid = Number(line.slice(0, firstSpace));
      const command = line.slice(firstSpace + 1).trim();
      return { pid, command };
    })
    .filter(Boolean)
    .filter((entry) => entry.pid !== process.pid)
    .filter((entry) => hasMatchingProcess(entry.command));

  if (existing.length > 0) {
    const details = existing
      .map((entry) => `- ${entry.pid}: ${entry.command}`)
      .join("\n");

    console.error("A Next.js dev process is already running for this repo.");
    console.error("Stop it first to avoid memory spikes and duplicate watchers.");
    console.error("\nDetected process(es):");
    console.error(details);
    console.error("\nUse `npm run dev:clean` and then start again.");
    process.exit(1);
  }
} catch (error) {
  console.warn("Could not verify running dev processes; continuing.");
  console.warn(String(error));
}
