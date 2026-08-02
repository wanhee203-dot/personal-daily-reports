async function waitForImages(): Promise<void> {
  const images = Array.from(document.images);

  await Promise.all(
    images.map((image) => {
      if (image.complete && image.naturalWidth > 0) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve, reject) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener(
          "error",
          () => reject(new Error(`Image failed: ${image.currentSrc}`)),
          { once: true }
        );
      });
    })
  );
}

export async function markRenderReady(): Promise<void> {
  await document.fonts.ready;
  await waitForImages();
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    )
  );
  document.body.dataset.renderStatus = "ready";
}
