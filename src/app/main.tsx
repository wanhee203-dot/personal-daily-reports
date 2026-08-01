import React from "react";
import ReactDOM from "react-dom/client";
import type { DailyReport } from "../schema/report-types";
import { DailyReportPage } from "../template/DailyReportPage";
import { markRenderReady } from "./render-readiness";

async function bootstrap(): Promise<void> {
  document.body.dataset.renderStatus = "loading";

  const response = await fetch("/__report-data.json", {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Report data request failed: ${response.status}`);
  }

  const report = (await response.json()) as DailyReport;
  const root = document.getElementById("root");

  if (!root) {
    throw new Error("Missing #root element");
  }

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <DailyReportPage report={report} />
    </React.StrictMode>
  );

  await markRenderReady();
}

bootstrap().catch((error: unknown) => {
  document.body.dataset.renderStatus = "error";
  document.body.dataset.renderError =
    error instanceof Error ? error.message : String(error);
  console.error(error);
});
