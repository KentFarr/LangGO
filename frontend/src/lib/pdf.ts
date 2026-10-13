import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Bundling the worker keeps it in lockstep with the installed pdfjs-dist version.
GlobalWorkerOptions.workerSrc = workerUrl;

/** Extracts all text from a PDF in the browser; the file is never uploaded. */
export async function extractTextFromPdf(file: File): Promise<string> {
  const loadingTask = getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  try {
    const pdf = await loadingTask.promise;
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(''));
    }
    return pages.join('\n');
  } finally {
    // Releases the document and its worker.
    await loadingTask.destroy();
  }
}
