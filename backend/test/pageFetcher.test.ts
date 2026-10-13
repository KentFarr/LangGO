import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createPageFetcher,
  decodeBody,
  extractReadableText,
  isPublicAddress,
  safeLookup,
  validatePageUrl,
} from '../src/services/pageFetcher.js';

describe('isPublicAddress', () => {
  it.each([
    ['127.0.0.1', false],
    ['10.1.2.3', false],
    ['172.16.0.1', false],
    ['192.168.1.10', false],
    ['169.254.169.254', false], // cloud metadata endpoint
    ['100.64.0.1', false], // carrier-grade NAT
    ['0.0.0.0', false],
    ['::1', false],
    ['fe80::1', false],
    ['fd00::1', false],
    ['::ffff:127.0.0.1', false], // IPv4-mapped loopback
    ['not-an-ip', false],
    ['8.8.8.8', true],
    ['2606:4700:4700::1111', true],
  ])('%s → %s', (address, expected) => {
    expect(isPublicAddress(address)).toBe(expected);
  });
});

describe('validatePageUrl', () => {
  it.each([
    'ftp://example.com/file',
    'file:///etc/passwd',
    'javascript:alert(1)',
    'http://localhost/admin',
    'http://app.localhost/',
    'http://127.0.0.1/',
    'http://[::1]/',
    'http://169.254.169.254/latest/meta-data',
    'http://user:secret@example.com/',
    'http://example.com:8080/',
    'not a url',
  ])('rejects %s', (url) => {
    expect(() => validatePageUrl(url)).toThrow();
  });

  it('accepts public http(s) URLs and drops the fragment', () => {
    expect(validatePageUrl(' https://www3.nhk.or.jp/news/easy/#top ').href).toBe('https://www3.nhk.or.jp/news/easy/');
    expect(validatePageUrl('http://example.com:80/a').href).toBe('http://example.com/a');
  });
});

describe('safeLookup', () => {
  it('refuses hostnames that resolve to non-public addresses', async () => {
    const error = await new Promise<NodeJS.ErrnoException | null>((resolve) =>
      safeLookup('localhost', {}, (err) => resolve(err)),
    );
    expect(error?.code).toBe('EBLOCKED');
  });
});

describe('decodeBody', () => {
  // 日本語 in Shift_JIS
  const sjis = new Uint8Array([0x93, 0xfa, 0x96, 0x7b, 0x8c, 0xea]);

  it('uses the charset from the Content-Type header', () => {
    expect(decodeBody(sjis, 'text/html; charset=Shift_JIS')).toBe('日本語');
  });

  it('falls back to a <meta charset> tag', () => {
    const head = new TextEncoder().encode('<meta charset="shift_jis">');
    const bytes = new Uint8Array([...head, ...sjis]);
    expect(decodeBody(bytes, 'text/html')).toContain('日本語');
  });

  it('defaults to UTF-8 and survives unknown charsets', () => {
    const utf8 = new TextEncoder().encode('勉強');
    expect(decodeBody(utf8, null)).toBe('勉強');
    expect(decodeBody(utf8, 'text/html; charset=made-up')).toBe('勉強');
  });
});

const ARTICLE = `<!doctype html><html><head><title>ニュース</title><style>.x{}</style></head><body>
  <nav>ホーム メニュー ログイン</nav>
  <article><h1>環境のニュース</h1>
    <p>今日、学校で環境について勉強しました。環境を守ることは大切です。</p>
    <p>先生は、毎日の生活の中でできることを説明しました。私たちは約束をしました。</p>
  </article>
  <script>var tracking = "広告";</script>
</body></html>`;

describe('extractReadableText', () => {
  it('returns the title and the article text without scripts', () => {
    const { title, text } = extractReadableText(ARTICLE);
    expect(title).toBe('ニュース');
    expect(text).toContain('環境について勉強しました');
    expect(text).not.toContain('tracking');
  });

  it('truncates very long pages', () => {
    expect(extractReadableText(ARTICLE, 10).text).toHaveLength(10);
  });
});

describe('createPageFetcher (against a local server)', () => {
  let server: Server;
  let base: string;

  beforeAll(async () => {
    server = createServer((req, res) => {
      switch (req.url) {
        case '/article':
          res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(ARTICLE);
          break;
        case '/sjis':
          res.writeHead(200, { 'content-type': 'text/plain; charset=Shift_JIS' });
          res.end(Buffer.from([0x93, 0xfa, 0x96, 0x7b, 0x8c, 0xea]));
          break;
        case '/redirect':
          res.writeHead(302, { location: '/article' }).end();
          break;
        case '/loop':
          res.writeHead(302, { location: '/loop' }).end();
          break;
        case '/to-credentials':
          // A target the per-hop validation must refuse even with private networks allowed.
          res.writeHead(302, { location: `http://user:secret@${req.headers.host}/article` }).end();
          break;
        case '/huge':
          res.writeHead(200, { 'content-type': 'text/html' }).end('あ'.repeat(4000));
          break;
        case '/image':
          res.writeHead(200, { 'content-type': 'image/png' }).end('png');
          break;
        case '/slow':
          // Never responds.
          break;
        default:
          res.writeHead(404).end();
      }
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });

  const fetcher = (options = {}) => createPageFetcher({ allowPrivateNetworks: true, timeoutMs: 1500, ...options });

  it('blocks localhost by default', async () => {
    await expect(createPageFetcher()(`${base}/article`)).rejects.toMatchObject({ status: 400 });
  });

  it('fetches and extracts an article', async () => {
    const page = await fetcher()(`${base}/article`);
    expect(page).toMatchObject({ url: `${base}/article`, title: 'ニュース' });
    expect(page.text).toContain('約束をしました');
  });

  it('decodes Shift_JIS plain text', async () => {
    expect((await fetcher()(`${base}/sjis`)).text).toBe('日本語');
  });

  it('follows redirects, but not forever', async () => {
    expect((await fetcher()(`${base}/redirect`)).url).toBe(`${base}/article`);
    await expect(fetcher()(`${base}/loop`)).rejects.toMatchObject({ status: 502 });
  });

  it('re-validates every redirect target', async () => {
    await expect(fetcher()(`${base}/to-credentials`)).rejects.toMatchObject({ status: 400 });
  });

  it('rejects oversized pages, non-HTML content and error statuses', async () => {
    await expect(fetcher({ maxBytes: 1000 })(`${base}/huge`)).rejects.toMatchObject({ status: 413 });
    await expect(fetcher()(`${base}/image`)).rejects.toMatchObject({ status: 415 });
    await expect(fetcher()(`${base}/missing`)).rejects.toMatchObject({ status: 502 });
  });

  it('times out slow pages', async () => {
    await expect(fetcher({ timeoutMs: 300 })(`${base}/slow`)).rejects.toMatchObject({ status: 504 });
  });
});
