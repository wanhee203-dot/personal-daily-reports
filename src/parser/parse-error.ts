export class ParseReportError extends Error {
  readonly filePath: string;
  readonly line: number;

  constructor(message: string, filePath: string, line: number) {
    super(message);
    this.name = "ParseReportError";
    this.filePath = filePath;
    this.line = line;
  }
}
