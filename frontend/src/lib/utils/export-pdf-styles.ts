/**
 * Strips all stylesheets from the html2canvas clone so global theme CSS
 * (color-mix, oklch, CSS variables) cannot be parsed.
 */
export function sanitizeCloneForPdf(clonedDoc: Document): void {
  clonedDoc.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    node.remove();
  });

  clonedDoc.querySelectorAll("*").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.removeAttribute("class");
    node.style.filter = "none";
    node.style.backdropFilter = "none";
    node.style.boxShadow = "none";
    node.style.textShadow = "none";
    node.style.animation = "none";
    node.style.transition = "none";
  });

  if (clonedDoc.body instanceof HTMLElement) {
    clonedDoc.body.style.margin = "0";
    clonedDoc.body.style.padding = "0";
    clonedDoc.body.style.backgroundColor = "#ffffff";
  }
}
