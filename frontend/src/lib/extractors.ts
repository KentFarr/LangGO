/**
 * Turns uploaded files into plain text for word matching. Everything runs in the browser, so
 * files are never uploaded. Heavy parsers (pdf.js, unzip) are loaded only when needed.
 */

export type FileKind = 'pdf' | 'text' | 'subtitles' | 'html' | 'docx' | 'epub';

const EXTENSIONS: Record<string, FileKind> = {
  pdf: 'pdf',
  txt: 'text',
  md: 'text',
  srt: 'subtitles',
  vtt: 'subtitles',
  html: 'html',
  htm: 'html',
  docx: 'docx',
  epub: 'epub',
};

/** Value for the file input's `accept` attribute. */
export const ACCEPTED_FILE_TYPES = Object.keys(EXTENSIONS)
  .map((ext) => `.${ext}`)
  .join(',');

export const FILE_TYPE_LABEL = 'PDF, EPUB, Word (.docx), text, subtitles (.srt/.vtt) or HTML';

export function fileKind(file: File): FileKind | null {
  const ext = file.name.toLowerCase().split('.').pop() ?? '';
  if (file.type === 'application/pdf') return 'pdf';
  return EXTENSIONS[ext] ?? null;
}

/** Decodes text files as UTF-8, falling back to Shift_JIS (common for older Japanese files). */
export function decodeText(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('shift_jis').decode(bytes);
  }
}

/** Removes cue numbers, timestamps, headers and styling tags from SRT/WebVTT subtitles. */
export function stripSubtitles(raw: string): string {
  return raw
    .replace(/\r/g, '')
    .split('\n\n')
    .filter((block) => !/^(WEBVTT|NOTE|STYLE|REGION)\b/.test(block.trim()))
    .map((block) =>
      block
        .split('\n')
        .filter((line) => !/^\d+$/.test(line.trim()) && !line.includes('-->'))
        .join('\n'),
    )
    .join('\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\{\\[^}]*\}/g, '')
    .trim();
}

/** Visible text of an HTML/XHTML document, without scripts or furigana (<rt>) readings. */
export function htmlToText(markup: string, type: DOMParserSupportedType = 'text/html'): string {
  let doc = new DOMParser().parseFromString(markup, type);
  if (doc.querySelector('parsererror')) doc = new DOMParser().parseFromString(markup, 'text/html');
  doc.querySelectorAll('script, style, noscript, template, rt, rp').forEach((el) => el.remove());
  // Keep block boundaries so words from adjacent paragraphs don't run together.
  doc.querySelectorAll('p, div, br, li, h1, h2, h3, h4, h5, h6, tr').forEach((el) => el.append('\n'));
  return (doc.body ?? doc.documentElement)?.textContent?.trim() ?? '';
}

/** Text of a Word document's main body XML (word/document.xml): paragraphs of <w:t> runs. */
export function docxXmlToText(xml: string): string {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  return Array.from(doc.getElementsByTagName('w:p'))
    .map((paragraph) =>
      Array.from(paragraph.getElementsByTagName('w:t'))
        .map((run) => run.textContent ?? '')
        .join(''),
    )
    .filter(Boolean)
    .join('\n');
}

async function unzip(file: File): Promise<Record<string, Uint8Array>> {
  const { unzipSync } = await import('fflate');
  try {
    return unzipSync(new Uint8Array(await file.arrayBuffer()));
  } catch {
    throw new Error("This file couldn't be opened. It may be damaged or not a real .docx/.epub.");
  }
}

const utf8 = (bytes: Uint8Array | undefined) => (bytes ? new TextDecoder().decode(bytes) : '');

/** Resolves a path relative to the directory of `base` inside a zip archive. */
function resolveZipPath(base: string, relative: string): string {
  const parts = base.split('/').slice(0, -1);
  for (const segment of decodeURIComponent(relative.split('#')[0]!).split('/')) {
    if (segment === '..') parts.pop();
    else if (segment && segment !== '.') parts.push(segment);
  }
  return parts.join('/');
}

/** Reads an EPUB's chapters in reading (spine) order. */
export function epubToText(files: Record<string, Uint8Array>): string {
  const container = new DOMParser().parseFromString(utf8(files['META-INF/container.xml']), 'application/xml');
  const opfPath = container.querySelector('rootfile')?.getAttribute('full-path');
  if (!opfPath || !files[opfPath]) throw new Error("This EPUB's table of contents couldn't be read.");

  const opf = new DOMParser().parseFromString(utf8(files[opfPath]), 'application/xml');
  const hrefs = new Map(
    Array.from(opf.getElementsByTagName('item')).map((item) => [item.getAttribute('id'), item.getAttribute('href')]),
  );

  return Array.from(opf.getElementsByTagName('itemref'))
    .map((ref) => hrefs.get(ref.getAttribute('idref')))
    .filter((href): href is string => Boolean(href))
    .map((href) => htmlToText(utf8(files[resolveZipPath(opfPath, href)]), 'application/xhtml+xml'))
    .filter(Boolean)
    .join('\n');
}

export async function extractTextFromFile(file: File): Promise<string> {
  switch (fileKind(file)) {
    case 'pdf': {
      const { extractTextFromPdf } = await import('./pdf');
      return extractTextFromPdf(file);
    }
    case 'text':
      return decodeText(new Uint8Array(await file.arrayBuffer()));
    case 'subtitles':
      return stripSubtitles(decodeText(new Uint8Array(await file.arrayBuffer())));
    case 'html':
      return htmlToText(decodeText(new Uint8Array(await file.arrayBuffer())));
    case 'docx': {
      const xml = utf8((await unzip(file))['word/document.xml']);
      if (!xml) throw new Error("This Word document couldn't be read.");
      return docxXmlToText(xml);
    }
    case 'epub':
      return epubToText(await unzip(file));
    default:
      throw new Error(`Unsupported file type. Try ${FILE_TYPE_LABEL}.`);
  }
}
