import React from "react";
import ReactDOM from "react-dom/client";
import type { PosterDocument } from "../markdown/document-types";
import { MarkdownPosterPage } from "../template/MarkdownPosterPage";
import { markRenderReady } from "./render-readiness";

async function bootstrap(): Promise<void> {
  document.body.dataset.renderStatus = "loading";

  const response = await fetch("/__report-data.json", {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Report data request failed: ${response.status}`);
  }

  const poster = (await response.json()) as PosterDocument;
  const root = document.getElementById("root");

  if (!root) {
    throw new Error("Missing #root element");
  }

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <MarkdownPosterPage document={poster} />
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
