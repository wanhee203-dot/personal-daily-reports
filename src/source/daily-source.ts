import path from "node:path";

export interface DailySourceIdentity {
  year: string;
  month: string;
  startDay: number;
  endDay?: number;
  dateLabel: string;
  outputStem: string;
  sourceDir: string;
}

const DAILY_FILE =
  /^(\d{4})-(\d{2})-(\d{2})(?:-(\d{2}))?\.md$/i;

function invalidDailySource(sourcePath: string): never {
  throw new Error(
    `Invalid daily source path: ${sourcePath}. ` +
      "Expected daily/YYYY-MM/YYYY-MM-DD.md or " +
      "daily/YYYY-MM/YYYY-MM-DD-DD.md"
  );
}

export function resolveDailySource(
  sourcePath: string,
  projectRoot: string
): DailySourceIdentity {
  const absoluteSource = path.resolve(sourcePath);
  const absoluteRoot = path.resolve(projectRoot);
  const dailyRoot = path.join(absoluteRoot, "daily");
  const relative = path.relative(dailyRoot, absoluteSource);
  const parts = relative.split(path.sep);
  const match = DAILY_FILE.exec(path.basename(absoluteSource));

  if (
    parts.length !== 2 ||
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    !match
  ) {
    return invalidDailySource(absoluteSource);
  }

  const [, year, month, startText, endText] = match;

  if (parts[0] !== `${year}-${month}`) {
    return invalidDailySource(absoluteSource);
  }

  const monthNumber = Number(month);
  const startDay = Number(startText);
  const endDay =
    endText === undefined ? undefined : Number(endText);

  if (monthNumber < 1 || monthNumber > 12) {
    return invalidDailySource(absoluteSource);
  }

  const maxDay = new Date(
    Number(year),
    monthNumber,
    0
  ).getDate();

  if (startDay < 1 || startDay > maxDay) {
    return invalidDailySource(absoluteSource);
  }

  if (
    endDay !== undefined &&
    (endDay < startDay || endDay > maxDay)
  ) {
    return invalidDailySource(absoluteSource);
  }

  return {
    year,
    month,
    startDay,
    endDay,
    dateLabel:
      endDay === undefined
        ? `${year}-${month}-${startText}`
        : `${year}-${month}-${startText}—${endDay}`,
    outputStem:
      endDay === undefined
        ? `${startDay}`
        : `${startDay}-${endDay}`,
    sourceDir: path.dirname(absoluteSource)
  };
}
