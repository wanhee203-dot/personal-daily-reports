import { createHash } from "node:crypto";
import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { ReportManifest } from "./manifest";

export interface OutputFingerprint {
  sourceHash: string;
  templateVersion: string;
  generatorVersion: string;
  scale: 1 | 2;
}

export async function sha256File(filePath: string): Promise<string> {
  const bytes = await readFile(filePath);
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

async function isNonEmpty(filePath: string): Promise<boolean> {
  try {
    const value = await stat(filePath);
    return value.isFile() && value.size > 0;
  } catch {
    return false;
  }
}

export async function isOutputCurrent(
  finalOutputDir: string,
  fingerprint: OutputFingerprint
): Promise<boolean> {
  const manifestPath = path.join(finalOutputDir, "manifest.json");

  try {
    await access(manifestPath);
    const manifest = JSON.parse(
      await readFile(manifestPath, "utf8")
    ) as ReportManifest;

    const matches =
      manifest.sourceHash === fingerprint.sourceHash &&
      manifest.template.version === fingerprint.templateVersion &&
      manifest.generatorVersion === fingerprint.generatorVersion &&
      manifest.render.scale === fingerprint.scale;

    if (!matches) return false;

    return await Promise.all([
      isNonEmpty(path.join(finalOutputDir, "report.png")),
      isNonEmpty(path.join(finalOutputDir, "report.pdf")),
      isNonEmpty(path.join(finalOutputDir, "report.json"))
    ]).then((values) => values.every(Boolean));
  } catch {
    return false;
  }
}
