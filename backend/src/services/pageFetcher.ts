import { lookup as dnsLookup, type LookupAddress } from 'node:dns';
import ipaddr from 'ipaddr.js';
import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';
import { Agent, fetch, type Dispatcher } from 'undici';
import { HttpError } from '../errors.js';

/**
 * Fetches a user-supplied web page and returns its readable text.
 *
 * Fetching arbitrary URLs from the server is a classic SSRF risk, so:
 * - only http(s) on the default ports, no credentials in the URL;
 * - every resolved address must be public unicast (no loopback, private, link-local, cloud
 *   metadata, …). The check runs inside the socket's DNS lookup, so a hostname can't pass
 *   validation and then resolve to a private address when connecting (DNS rebinding);
 * - redirects are followed manually and each hop is validated again;
 * - responses are capped by time and size, and only HTML/text is accepted.
 */

export interface FetchedPage {
  url: string;
  title: string;
  text: string;
}

export type PageFetcher = (url: string) => Promise<FetchedPage>;

export interface PageFetcherOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  maxTextLength?: number;
  /** Only for tests that serve pages from localhost. */
  allowPrivateNetworks?: boolean;
}

const BLOCKED = (message = "That address can't be fetched.") => new HttpError(400, message);

/** True for globally routable unicast addresses; false for loopback, private, link-local, etc. */
export function isPublicAddress(address: string): boolean {
  if (!ipaddr.isValid(address)) return false;
  let parsed = ipaddr.parse(address);
  if (parsed.kind() === 'ipv6' && (parsed as ipaddr.IPv6).isIPv4MappedAddress()) {
    parsed = (parsed as ipaddr.IPv6).toIPv4Address();
  }
  return parsed.range() === 'unicast';
}

/** Parses and checks the URL itself (scheme, port, credentials, literal IPs). */
export function validatePageUrl(raw: string, { allowPrivateNetworks = false } = {}): URL {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw BLOCKED('Please enter a valid web address, starting with https://');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw BLOCKED('Only http and https links are supported.');
  if (url.username || url.password) throw BLOCKED();
  if (!allowPrivateNetworks) {
    if (url.port && url.port !== '80' && url.port !== '443') throw BLOCKED();
    const host = url.hostname.replace(/^\[|\]$/g, '');
    if (host === 'localhost' || host.endsWith('.localhost')) throw BLOCKED();
    // Literal IPs skip DNS, so check them here.
    if (ipaddr.isValid(host) && !isPublicAddress(host)) throw BLOCKED();
  }
  url.hash = '';
  return url;
}

type LookupCallback = (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void;

/** DNS lookup used for every outgoing connection: refuses non-public addresses. */
export function safeLookup(hostname: string, options: object, callback: LookupCallback) {
  dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, []);
    const list = addresses as LookupAddress[];
    const blocked = list.find((a) => !isPublicAddress(a.address));
    if (blocked || list.length === 0) {
      const error: NodeJS.ErrnoException = new Error(`Blocked address for ${hostname}`);
      error.code = 'EBLOCKED';
      return callback(error, []);
    }
    // undici/net may ask for one address or all of them.
    if ((options as { all?: boolean }).all) return callback(null, list);
    callback(null, list[0]!.address, list[0]!.family);
  });
}

const CHARSET_IN_META = /<meta[^>]+charset\s*=\s*["']?\s*([\w-]+)/i;

/** Decodes the body using the charset from the header or a <meta> tag (Shift_JIS, EUC-JP…). */
export function decodeBody(bytes: Uint8Array, contentType: string | null): string {
  let charset = /charset\s*=\s*"?([\w-]+)/i.exec(contentType ?? '')?.[1];
  if (!charset) {
    const head = new TextDecoder('latin1').decode(bytes.subarray(0, 4096));
    charset = CHARSET_IN_META.exec(head)?.[1];
  }
  try {
    return new TextDecoder(charset ?? 'utf-8').decode(bytes);
  } catch {
    return new TextDecoder('utf-8').decode(bytes);
  }
}

/** Main article text via Readability (Firefox reader mode), falling back to the whole body. */
export function extractReadableText(html: string, maxLength = 200_000): { title: string; text: string } {
  const { document } = parseHTML(html);
  const title = (document.querySelector('title')?.textContent ?? '').trim();

  let text = '';
  try {
    const article = new Readability(document as unknown as ConstructorParameters<typeof Readability>[0]).parse();
    text = article?.textContent ?? '';
  } catch {
    // Fall through to the body text.
  }
  if (text.trim().length < 50) {
    const fallback = parseHTML(html).document;
    fallback.querySelectorAll('script, style, noscript, template, svg').forEach((el: { remove(): void }) => el.remove());
    text = fallback.body?.textContent ?? '';
  }

  return { title, text: text.replace(/[ \t\u3000]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim().slice(0, maxLength) };
}

async function readCapped(body: ReadableStream<Uint8Array> | null, maxBytes: number): Promise<Uint8Array> {
  if (!body) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for await (const chunk of body) {
    total += chunk.byteLength;
    if (total > maxBytes) throw new HttpError(413, 'That page is too large to read.');
    chunks.push(chunk);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

export function createPageFetcher({
  timeoutMs = 10_000,
  maxBytes = 2 * 1024 * 1024,
  maxRedirects = 4,
  maxTextLength = 200_000,
  allowPrivateNetworks = false,
}: PageFetcherOptions = {}): PageFetcher {
  const dispatcher: Dispatcher = new Agent({
    connect: allowPrivateNetworks ? {} : { lookup: safeLookup },
    headersTimeout: timeoutMs,
    bodyTimeout: timeoutMs,
  });

  return async (rawUrl) => {
    let url = validatePageUrl(rawUrl, { allowPrivateNetworks });
    const signal = AbortSignal.timeout(timeoutMs);

    for (let hop = 0; ; hop++) {
      let response;
      try {
        response = await fetch(url, {
          dispatcher,
          redirect: 'manual',
          signal,
          headers: {
            accept: 'text/html,application/xhtml+xml,text/plain;q=0.9',
            'accept-language': 'ja,en;q=0.8',
            'user-agent': 'Mozilla/5.0 (compatible; LangGoBot/1.0; +https://langgo.co)',
          },
        });
      } catch (error) {
        const code = (error as { cause?: { code?: string } }).cause?.code;
        if (code === 'EBLOCKED') throw BLOCKED();
        if (signal.aborted) throw new HttpError(504, 'That page took too long to respond.');
        throw new HttpError(502, "Couldn't reach that page. Check the address and try again.", { cause: error });
      }

      if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
        await response.body?.cancel();
        if (hop >= maxRedirects) throw new HttpError(502, 'That page redirects too many times.');
        url = validatePageUrl(new URL(response.headers.get('location')!, url).href, { allowPrivateNetworks });
        continue;
      }
      if (!response.ok) {
        await response.body?.cancel();
        throw new HttpError(502, `That page returned an error (${response.status}).`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && !/text\/html|application\/xhtml\+xml|text\/plain/i.test(contentType)) {
        await response.body?.cancel();
        throw new HttpError(415, 'That link is not a web page. Try uploading the file instead.');
      }

      const declared = Number(response.headers.get('content-length'));
      if (declared > maxBytes) {
        await response.body?.cancel();
        throw new HttpError(413, 'That page is too large to read.');
      }

      const body = decodeBody(await readCapped(response.body, maxBytes), contentType);
      const page = /text\/plain/i.test(contentType ?? '')
        ? { title: url.hostname, text: body.slice(0, maxTextLength) }
        : extractReadableText(body, maxTextLength);
      return { url: url.href, title: page.title || url.hostname, text: page.text };
    }
  };
}
