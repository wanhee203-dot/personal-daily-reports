import type { Page } from "playwright";
import {
  MAX_REPORT_HEIGHT,
  MIN_REPORT_HEIGHT,
  REPORT_WIDTH,
  WARN_REPORT_HEIGHT
} from "../core/constants";

export interface LayoutMeasurement {
  cssWidth: number;
  cssHeight: number;
  warning?: string;
}

async function waitForStableHeight(
  page: Page,
  selector: string
): Promise<number> {
  let previous = -1;
  let stableCount = 0;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const height = await page.locator(selector).evaluate(
      (element) => Math.ceil(element.getBoundingClientRect().height)
    );

    if (height === previous) {
      stableCount += 1;
      if (stableCount >= 3) return height;
    } else {
      stableCount = 0;
      previous = height;
    }

    await page.waitForTimeout(100);
  }

  throw new Error("Report layout did not stabilize");
}

export async function waitForRenderReady(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      document.body.dataset.renderStatus === "ready" ||
      document.body.dataset.renderStatus === "error",
    undefined,
    { timeout: 15_000 }
  );

  const status = await page.locator("body").getAttribute(
    "data-render-status"
  );

  if (status === "error") {
    const message = await page.locator("body").getAttribute(
      "data-render-error"
    );
    throw new Error(`Render page failed: ${message ?? "unknown error"}`);
  }

  await page.evaluate(() => document.fonts.ready);
}

export async function measureAndValidateLayout(
  page: Page
): Promise<LayoutMeasurement> {
  const root = page.locator("#daily-report");

  if ((await root.count()) !== 1) {
    throw new Error("Expected exactly one #daily-report root");
  }

  const cssHeight = await waitForStableHeight(page, "#daily-report");

  const values = await root.evaluate((element) => {
    const html = element as HTMLElement;
    return {
      width: Math.ceil(html.getBoundingClientRect().width),
      scrollWidth: html.scrollWidth,
      clientWidth: html.clientWidth,
      clippedElements: Array.from(
        html.querySelectorAll<HTMLElement>(
          "[data-check-clipping='true']"
        )
      )
        .filter((node) => {
          const style = getComputedStyle(node);
          const clipsVertically =
            style.overflowY !== "visible" &&
            node.scrollHeight > node.clientHeight;
          const clipsHorizontally =
            style.overflowX !== "visible" &&
            node.scrollWidth > node.clientWidth;

          return clipsVertically || clipsHorizontally;
        })
        .map((node) => node.textContent?.slice(0, 80) ?? "")
    };
  });

  if (values.width !== REPORT_WIDTH) {
    throw new Error(
      `Report width must be ${REPORT_WIDTH}px, received ${values.width}px`
    );
  }

  if (
    values.scrollWidth !== values.clientWidth ||
    values.scrollWidth !== REPORT_WIDTH
  ) {
    throw new Error(
      `Horizontal overflow detected: scrollWidth=${values.scrollWidth}, clientWidth=${values.clientWidth}`
    );
  }

  if (values.clippedElements.length > 0) {
    throw new Error(
      `Clipped content detected: ${values.clippedElements.join(" | ")}`
    );
  }

  if (cssHeight < MIN_REPORT_HEIGHT) {
    throw new Error(
      `Report height is below ${MIN_REPORT_HEIGHT}px: ${cssHeight}px`
    );
  }

  if (cssHeight > MAX_REPORT_HEIGHT) {
    throw new Error(
      `Report height exceeds ${MAX_REPORT_HEIGHT}px: ${cssHeight}px`
    );
  }

  return {
    cssWidth: values.width,
    cssHeight,
    warning:
      cssHeight > WARN_REPORT_HEIGHT
        ? `Report height exceeds ${WARN_REPORT_HEIGHT}px`
        : undefined
  };
}
