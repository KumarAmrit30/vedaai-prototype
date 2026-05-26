"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { createRoot, type Root } from "react-dom/client";
import { AssignmentPdfExport } from "@/components/assignment/assignment-pdf-export";
import { buildAssignmentPdfFilename } from "@/lib/utils/format-assignment";
import { EXPORT_MOUNT_ID } from "@/lib/utils/export-pdf-constants";
import { PDF_EXPORT_WIDTH_PX } from "@/lib/utils/export-pdf-colors";
import { sanitizeCloneForPdf } from "@/lib/utils/export-pdf-styles";
import type { Assignment } from "@/types/assignment";

export { ASSIGNMENT_PREVIEW_ID } from "@/lib/utils/export-pdf-constants";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 10;
const CAPTURE_SCALE = 2;
const CHUNK_HEIGHT_PX = 3200;

async function waitForLayout(): Promise<void> {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 150);
  });
}

function applyExportIframeStyles(iframe: HTMLIFrameElement): void {
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = `${PDF_EXPORT_WIDTH_PX}px`;
  iframe.style.border = "none";
  iframe.style.pointerEvents = "none";
  iframe.style.overflow = "hidden";
  iframe.style.zIndex = "-1";
  iframe.style.backgroundColor = "#ffffff";
}

async function renderExportRoot(assignment: Assignment): Promise<{
  element: HTMLElement;
  cleanup: () => void;
}> {
  document.getElementById(EXPORT_MOUNT_ID)?.remove();

  const iframe = document.createElement("iframe");
  iframe.id = EXPORT_MOUNT_ID;
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("title", "PDF export");
  applyExportIframeStyles(iframe);
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!iframeDoc) {
    iframe.remove();
    throw new Error("PDF export iframe document is unavailable.");
  }

  iframeDoc.open();
  iframeDoc.write(
    '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#ffffff;"></body></html>',
  );
  iframeDoc.close();

  let root: Root | null = createRoot(iframeDoc.body);
  root.render(<AssignmentPdfExport assignment={assignment} />);
  await waitForLayout();

  const element = iframeDoc.querySelector<HTMLElement>("[data-assignment-paper]");
  if (!element) {
    root.unmount();
    iframe.remove();
    throw new Error("PDF export target element was not rendered.");
  }

  iframe.style.height = `${Math.max(element.scrollHeight, element.offsetHeight) + 8}px`;

  return {
    element,
    cleanup: () => {
      root?.unmount();
      root = null;
      iframe.remove();
    },
  };
}

async function captureChunk(
  element: HTMLElement,
  yOffset: number,
  chunkHeight: number,
): Promise<HTMLCanvasElement> {
  return html2canvas(element, {
    scale: CAPTURE_SCALE,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    width: element.offsetWidth,
    height: chunkHeight,
    y: yOffset,
    scrollY: 0,
    windowWidth: element.offsetWidth,
    windowHeight: chunkHeight,
    onclone: (clonedDoc, clonedElement) => {
      sanitizeCloneForPdf(clonedDoc);
      if (clonedElement instanceof HTMLElement) {
        clonedElement.style.transform = "none";
        clonedElement.style.filter = "none";
        clonedElement.style.boxShadow = "none";
      }
    },
  });
}

async function captureElementInChunks(element: HTMLElement): Promise<HTMLCanvasElement[]> {
  console.log("PDF GENERATION START");
  console.log("PDF TARGET:", element);

  await waitForLayout();

  const totalHeight = Math.max(element.scrollHeight, element.offsetHeight);
  const chunks: HTMLCanvasElement[] = [];

  for (let yOffset = 0; yOffset < totalHeight; yOffset += CHUNK_HEIGHT_PX) {
    const chunkHeight = Math.min(CHUNK_HEIGHT_PX, totalHeight - yOffset);
    const canvas = await captureChunk(element, yOffset, chunkHeight);
    chunks.push(canvas);
  }

  if (chunks.length === 0) {
    throw new Error("PDF capture produced no canvas output.");
  }

  return chunks;
}

function appendCanvasToPdf(
  canvas: HTMLCanvasElement,
  pdf: jsPDF,
  pageState: { isFirstPage: boolean },
): void {
  const contentWidthMm = A4_WIDTH_MM - MARGIN_MM * 2;
  const contentHeightMm = A4_HEIGHT_MM - MARGIN_MM * 2;
  const pageHeightPx = Math.max(
    1,
    Math.floor((canvas.width * contentHeightMm) / contentWidthMm),
  );

  let renderedPx = 0;

  while (renderedPx < canvas.height) {
    if (!pageState.isFirstPage) {
      pdf.addPage();
    }
    pageState.isFirstPage = false;

    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx);
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceHeightPx;

    const ctx = sliceCanvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not create PDF rendering context.");
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(
      canvas,
      0,
      renderedPx,
      canvas.width,
      sliceHeightPx,
      0,
      0,
      canvas.width,
      sliceHeightPx,
    );

    const imgData = sliceCanvas.toDataURL("image/jpeg", 0.92);
    const sliceHeightMm = (sliceHeightPx * contentWidthMm) / canvas.width;

    pdf.addImage(
      imgData,
      "JPEG",
      MARGIN_MM,
      MARGIN_MM,
      contentWidthMm,
      sliceHeightMm,
    );

    renderedPx += sliceHeightPx;
  }
}

function canvasesToPdf(canvases: HTMLCanvasElement[]): jsPDF {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageState = { isFirstPage: true };

  for (const canvas of canvases) {
    appendCanvasToPdf(canvas, pdf, pageState);
  }

  return pdf;
}

/** Generates and downloads a real PDF via an isolated export-safe render tree. */
export async function exportAssignmentPdf(assignment: Assignment): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("PDF export requires a browser environment.");
  }

  const offscreen = await renderExportRoot(assignment);

  try {
    const canvases = await captureElementInChunks(offscreen.element);
    const pdf = canvasesToPdf(canvases);
    pdf.save(buildAssignmentPdfFilename(assignment.title));
  } finally {
    offscreen.cleanup();
  }
}
