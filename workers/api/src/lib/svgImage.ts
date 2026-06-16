/**
 * Cloudflare Workers don't ship a canvas implementation, so Kyzen renders
 * image endpoints as SVG. SVG is fast, tiny, scales perfectly, and is
 * supported directly by <img> tags and most chat embeds.
 */

const BRAND = {
  background: "#0F172A",
  surface: "#1E293B",
  primary: "#38BDF8",
  text: "#E2E8F0",
  muted: "#94A3B8",
};

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Wraps text into multiple lines based on an approximate character width. */
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length > maxCharsPerLine) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}

export interface QuoteImageOptions {
  text: string;
  author?: string;
  width?: number;
  height?: number;
}

export function renderQuoteSvg({ text, author, width = 800, height = 420 }: QuoteImageOptions): string {
  const lines = wrapText(text, 38).slice(0, 6);
  const lineHeight = 48;
  const startY = height / 2 - (lines.length * lineHeight) / 2;

  const textLines = lines
    .map(
      (line, i) =>
        `<text x="${width / 2}" y="${startY + i * lineHeight}" text-anchor="middle" font-size="32" font-family="Georgia, serif" fill="${BRAND.text}">${escapeXml(line)}</text>`
    )
    .join("\n");

  const authorLine = author
    ? `<text x="${width / 2}" y="${startY + lines.length * lineHeight + 48}" text-anchor="middle" font-size="20" font-family="monospace" fill="${BRAND.primary}">— ${escapeXml(author)}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${BRAND.background}" rx="16" />
  <rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="12" fill="none" stroke="${BRAND.surface}" stroke-width="2" />
  ${textLines}
  ${authorLine}
  <text x="${width - 24}" y="${height - 16}" text-anchor="end" font-size="14" font-family="monospace" fill="${BRAND.muted}">Kyzen API</text>
</svg>`;
}

export interface ProfileCardOptions {
  name: string;
  role?: string;
  width?: number;
  height?: number;
}

export function renderProfileCardSvg({ name, role, width = 600, height = 240 }: ProfileCardOptions): string {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${BRAND.background}" rx="16" />
  <rect x="16" y="16" width="${width - 32}" height="${height - 32}" rx="12" fill="${BRAND.surface}" />
  <circle cx="100" cy="${height / 2}" r="48" fill="${BRAND.primary}" />
  <text x="100" y="${height / 2 + 8}" text-anchor="middle" font-size="32" font-family="monospace" font-weight="bold" fill="${BRAND.background}">${escapeXml(initials)}</text>
  <text x="180" y="${height / 2 - 6}" font-size="28" font-family="sans-serif" font-weight="bold" fill="${BRAND.text}">${escapeXml(name)}</text>
  ${role ? `<text x="180" y="${height / 2 + 26}" font-size="18" font-family="monospace" fill="${BRAND.primary}">${escapeXml(role)}</text>` : ""}
  <text x="${width - 24}" y="${height - 16}" text-anchor="end" font-size="14" font-family="monospace" fill="${BRAND.muted}">Kyzen API</text>
</svg>`;
}

/** Encodes an SVG string as a base64 data URI for embedding in JSON responses. */
export function svgToDataUri(svg: string): string {
  const base64 = btoa(svg);
  return `data:image/svg+xml;base64,${base64}`;
}
