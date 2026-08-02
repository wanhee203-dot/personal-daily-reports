import {
  mkdir,
  rename,
  rm,
  stat
} from "node:fs/promises";
import path from "node:path";

async function exists(value: string): Promise<boolean> {
  try {
    await stat(value);
    return true;
  } catch {
    return false;
  }
}

export async function publishRunDirectory(
  tempOutputDir: string,
  finalOutputDir: string
): Promise<void> {
  const parent = path.dirname(finalOutputDir);
  const backup = `${finalOutputDir}.backup`;

  await mkdir(parent, { recursive: true });
  await rm(backup, { recursive: true, force: true });

  const hadExisting = await exists(finalOutputDir);

  try {
    if (hadExisting) {
      await rename(finalOutputDir, backup);
    }

    await rename(tempOutputDir, finalOutputDir);
    await rm(backup, { recursive: true, force: true });
  } catch (error) {
    if (await exists(finalOutputDir)) {
      await rm(finalOutputDir, { recursive: true, force: true });
    }
    if (hadExisting && (await exists(backup))) {
      await rename(backup, finalOutputDir);
    }
    throw error;
  }
}
