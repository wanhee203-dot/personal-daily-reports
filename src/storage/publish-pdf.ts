import {
  mkdir,
  rename,
  rm,
  stat
} from "node:fs/promises";
import path from "node:path";

async function exists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function publishPdf(
  tempPdfPath: string,
  finalPdfPath: string
): Promise<void> {
  const temporary = await stat(tempPdfPath);
  if (!temporary.isFile() || temporary.size === 0) {
    throw new Error(
      `Temporary PDF is missing or empty: ${tempPdfPath}`
    );
  }

  await mkdir(path.dirname(finalPdfPath), { recursive: true });

  const backupPath = `${finalPdfPath}.backup`;
  await rm(backupPath, { force: true });
  const hadExisting = await exists(finalPdfPath);

  try {
    if (hadExisting) {
      await rename(finalPdfPath, backupPath);
    }

    await rename(tempPdfPath, finalPdfPath);
    await rm(backupPath, { force: true });
  } catch (error) {
    if (await exists(finalPdfPath)) {
      await rm(finalPdfPath, { force: true });
    }

    if (hadExisting && (await exists(backupPath))) {
      await rename(backupPath, finalPdfPath);
    }

    throw error;
  }
}
