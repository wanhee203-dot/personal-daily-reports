import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page
} from "playwright";

export interface BrowserSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

export async function withBrowser<T>(
  scale: 1 | 2,
  operation: (session: BrowserSession) => Promise<T>
): Promise<T> {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: {
        width: 1080,
        height: 1000
      },
      deviceScaleFactor: scale,
      locale: "zh-CN",
      reducedMotion: "reduce"
    });

    const page = await context.newPage();
    await page.emulateMedia({ media: "screen" });

    return await operation({ browser, context, page });
  } finally {
    await browser.close();
  }
}
