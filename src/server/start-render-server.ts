import getPort from "get-port";
import { createServer, type ViteDevServer } from "vite";
import type { PosterDocument } from "../markdown/document-types";
import type { DailyReport } from "../schema/report-types";

export interface RenderServer {
  url: string;
  close(): Promise<void>;
}

export function startRenderServer(
  document: PosterDocument
): Promise<RenderServer>;
export function startRenderServer(
  document: DailyReport
): Promise<RenderServer>;
export async function startRenderServer(
  document: PosterDocument | DailyReport
): Promise<RenderServer> {
  const port = await getPort();
  const json = JSON.stringify(document);

  const vite: ViteDevServer = await createServer({
    server: {
      host: "127.0.0.1",
      port,
      strictPort: true
    },
    appType: "spa",
    logLevel: "error",
    plugins: [
      {
        name: "daily-report-data",
        configureServer(server) {
          server.middlewares.use(
            "/__report-data.json",
            (_request, response) => {
              response.statusCode = 200;
              response.setHeader(
                "Content-Type",
                "application/json; charset=utf-8"
              );
              response.setHeader("Cache-Control", "no-store");
              response.end(json);
            }
          );
        }
      }
    ]
  });

  await vite.listen();

  return {
    url: `http://127.0.0.1:${port}`,
    close: async () => {
      await vite.close();
    }
  };
}
