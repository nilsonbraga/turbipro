import { toPng } from "html-to-image";

async function waitImages(el: HTMLElement) {
  const imgs = Array.from(el.querySelectorAll("img")) as HTMLImageElement[];
  await Promise.all(
    imgs.map(
      (img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((res) => {
              img.onload = () => res();
              img.onerror = () => res();
            })
    )
  );
}

type ExportArtPngOptions = {
  filename?: string;
};

export async function exportArtPng(artEl: HTMLElement, options: ExportArtPngOptions = {}) {
  // esperar fontes
  // @ts-ignore
  await (document as any).fonts?.ready;

  // esperar imagens (uploads locais)
  await waitImages(artEl);

  // evitar diferença por animações/transitions
  artEl.classList.add("is-exporting");

  try {
    const dataUrl = await toPng(artEl, {
      cacheBust: true,
      pixelRatio: 2, // Export at 2x for high resolution
      backgroundColor: "transparent",
    });

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = options.filename || "arte.png";
    a.click();
  } finally {
    artEl.classList.remove("is-exporting");
  }
}
