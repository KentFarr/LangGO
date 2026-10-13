// Optimized photos produced by scripts/optimize-photos.sh: AVIF at 640/1280/1920 (+2880/3840 for
// full-bleed photos) and a 1920 px JPEG fallback.
const files = import.meta.glob<string>('../assets/photos/*', {
  eager: true,
  query: '?url',
  import: 'default',
});

const url = (file: string) => {
  const found = files[`../assets/photos/${file}`];
  if (!found) throw new Error(`Missing photo asset: ${file}`);
  return found;
};

interface PhotoDefinition {
  alt: string;
  /** Original aspect ratio (width / height), used for width/height attributes. */
  ratio: number;
  widths: readonly number[];
  /** CSS object-position for cropping. */
  position?: string;
}

const definitions = {
  'torii-fuji': {
    alt: 'Mount Fuji framed by the red gates of a hillside shrine, with cherry blossoms below',
    ratio: 4 / 3,
    widths: [640, 1280, 1920, 2880, 3840],
    position: '50% 40%',
  },
  'tokyo-skyline': {
    alt: "Tokyo's skyline stretching toward a distant, snow-capped Mount Fuji",
    ratio: 4 / 3,
    widths: [640, 1280, 1920, 2880, 3840],
    position: '50% 45%',
  },
  'kanji-shutters': {
    alt: 'A row of closed shop shutters painted with Japanese signs and kanji',
    ratio: 4032 / 2480,
    widths: [640, 1280, 1920],
    position: '60% 50%',
  },
  'shinjuku-neon': {
    alt: 'A Shinjuku street at night, lined with glowing Japanese signs',
    ratio: 2749 / 3665,
    widths: [640, 1280, 1920],
  },
  'pond-reader': {
    alt: 'A man reading a newspaper on a bench beside a park pond with a red bridge',
    ratio: 4 / 3,
    widths: [640, 1280, 1920],
    position: '50% 60%',
  },
  'fuji-garden': {
    alt: 'Mount Fuji rising behind houses and small garden plots under a clear sky',
    ratio: 4 / 3,
    widths: [640, 1280, 1920, 2880, 3840],
    position: '50% 55%',
  },
  doves: {
    alt: 'A carved relief of two white doves in a mint-green stone frame',
    ratio: 2,
    widths: [640, 1280, 1920, 2880, 3840],
  },
  pagoda: {
    alt: 'A five-story pagoda surrounded by spring trees',
    ratio: 3771 / 2828,
    widths: [640, 1280, 1920],
    position: '50% 30%',
  },
  'fuji-roofs': {
    alt: 'Snow-capped Mount Fuji above copper-roofed houses',
    ratio: 4 / 3,
    widths: [640, 1280, 1920],
    position: '50% 40%',
  },
} satisfies Record<string, PhotoDefinition>;

export type PhotoName = keyof typeof definitions;

export interface PhotoSource {
  alt: string;
  /** Width / height of the original photo. */
  ratio: number;
  avifSrcSet: string;
  fallback: string;
  width: number;
  height: number;
  position?: string;
}

export function photo(name: PhotoName): PhotoSource {
  const def: PhotoDefinition = definitions[name];
  return {
    alt: def.alt,
    ratio: def.ratio,
    avifSrcSet: def.widths.map((w) => `${url(`${name}-${w}.avif`)} ${w}w`).join(', '),
    fallback: url(`${name}-1920.jpg`),
    width: 1920,
    height: Math.round(1920 / def.ratio),
    position: def.position,
  };
}

/**
 * Adjusts a `sizes` attribute for a photo cropped with `object-fit: cover` into a frame of a
 * different shape. A wide photo in a tall frame is scaled by height, so it renders wider than the
 * frame; without this the browser downloads a size that's too small and the photo looks soft.
 */
export function coverSizes(sizes: string, photoRatio: number, frameRatio: number): string {
  const factor = photoRatio / frameRatio;
  if (factor <= 1) return sizes;
  return sizes
    .split(',')
    .map((entry) => {
      const match = /^\s*(\([^)]*\)\s+)?(.+?)\s*$/.exec(entry)!;
      return `${match[1] ?? ''}calc(${match[2]} * ${factor.toFixed(2)})`;
    })
    .join(', ');
}
