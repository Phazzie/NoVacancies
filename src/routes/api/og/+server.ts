/**
 * Dynamic Open Graph image endpoint.
 *
 * Returns a 1200×630 SVG sized for OG/Twitter card previews.
 *
 * Usage in <svelte:head>:
 *   <meta property="og:image" content="/api/og?title=...&scene=...&role=..." />
 *
 * Query params (all optional, all sanitised against XSS):
 *   title  — story title shown large (default "No Vacancies")
 *   scene  — current scene / chapter label
 *   role   — player job title / infrastructure role
 *   beat   — numeric beat count shown as a progress hint
 */
import type { RequestHandler } from '@sveltejs/kit';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Escape the five unsafe XML characters. */
function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/**
 * Naive word-wrap: split `text` into lines no longer than `maxChars`.
 * Returns at most `maxLines` lines; excess content is silently dropped.
 */
function wrapText(text: string, maxChars: number, maxLines: number): string[] {
	const words = text.split(/\s+/);
	const lines: string[] = [];
	let current = '';

	for (const word of words) {
		const candidate = current ? `${current} ${word}` : word;
		if (candidate.length <= maxChars) {
			current = candidate;
		} else {
			if (current) lines.push(current);
			if (lines.length >= maxLines) break;
			// Truncate a single word that's longer than maxChars
			current = word.length > maxChars ? word.slice(0, maxChars - 1) + '…' : word;
		}
	}
	if (current && lines.length < maxLines) lines.push(current);

	return lines;
}

// ─── SVG generation ───────────────────────────────────────────────────────────

interface OgParams {
	title: string;
	scene: string | null;
	role: string | null;
	beat: number | null;
}

function buildSvg({ title, scene, role, beat }: OgParams): string {
	const safeTitle = escapeXml(title);
	const safeScene = scene ? escapeXml(scene) : null;
	const safeRole = role ? escapeXml(role) : null;

	const titleLines = wrapText(safeTitle, 32, 3);
	const titleFontSize = titleLines.length > 1 ? 72 : 84;
	const titleLineHeight = titleFontSize * 1.15;
	const titleStartY = 260 - ((titleLines.length - 1) * titleLineHeight) / 2;

	// Bottom-row metadata pills
	const pills: string[] = [];
	if (safeScene) pills.push(`Scene: ${safeScene}`);
	if (safeRole) pills.push(safeRole);
	if (beat !== null) pills.push(`Beat ${beat}`);

	const pillSvg = pills
		.map((text, i) => {
			const x = 80 + i * 260;
			return `
    <rect x="${x}" y="536" width="240" height="42" rx="6" fill="#1e2d3d" stroke="#2a4060" stroke-width="1"/>
    <text x="${x + 120}" y="563" font-family="system-ui,sans-serif" font-size="20"
          fill="#94a3b8" text-anchor="middle">${escapeXml(text)}</text>`;
		})
		.join('');

	return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#070c14"/>
      <stop offset="100%" stop-color="#0d1a2e"/>
    </linearGradient>
    <!-- Neon glow filter for the sign text -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <!-- Subtle drop shadow for title text -->
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Subtle dot-grid texture -->
  <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
    <circle cx="1" cy="1" r="1" fill="#ffffff06"/>
  </pattern>
  <rect width="1200" height="630" fill="url(#dots)"/>

  <!-- Top border accent -->
  <rect x="0" y="0" width="1200" height="4" fill="#f59e0b" opacity="0.8"/>

  <!-- "NO VACANCIES" motel-sign header -->
  <rect x="80" y="42" width="460" height="64" rx="6"
        fill="#0a0d14" stroke="#f59e0b" stroke-width="1.5" opacity="0.9"/>
  <text x="310" y="88"
        font-family="'Courier New',Courier,monospace"
        font-size="30" font-weight="700" letter-spacing="6"
        fill="#f59e0b" text-anchor="middle" filter="url(#glow)">NO VACANCIES</text>

  <!-- Blinking dot accent (static in SVG, but evocative) -->
  <circle cx="570" cy="74" r="6" fill="#ef4444" opacity="0.9"/>

  <!-- Story title lines -->
${titleLines
	.map(
		(line, i) => `  <text x="600" y="${Math.round(titleStartY + i * titleLineHeight)}"
        font-family="system-ui,-apple-system,'Segoe UI',sans-serif"
        font-size="${titleFontSize}" font-weight="700"
        fill="#f1f5f9" text-anchor="middle" filter="url(#shadow)">${line}</text>`
	)
	.join('\n')}

  <!-- Horizontal rule -->
  <line x1="80" y1="490" x2="1120" y2="490" stroke="#1e3a5f" stroke-width="1"/>

  <!-- Metadata pills -->
${pillSvg}

  <!-- Branding — bottom right -->
  <text x="1120" y="590"
        font-family="system-ui,sans-serif" font-size="22" font-weight="600"
        fill="#f59e0b" text-anchor="end" opacity="0.7">no-vacancies.vercel.app</text>

  <!-- Bottom border accent -->
  <rect x="0" y="626" width="1200" height="4" fill="#f59e0b" opacity="0.4"/>
</svg>`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export const GET: RequestHandler = ({ url }) => {
	const raw = {
		title: url.searchParams.get('title')?.slice(0, 120) || 'No Vacancies',
		scene: url.searchParams.get('scene')?.slice(0, 80) ?? null,
		role: url.searchParams.get('role')?.slice(0, 60) ?? null,
		beatRaw: url.searchParams.get('beat')
	};

	const beat = raw.beatRaw ? parseInt(raw.beatRaw, 10) : null;

	const svg = buildSvg({
		title: raw.title,
		scene: raw.scene,
		role: raw.role,
		beat: Number.isFinite(beat) ? beat : null
	});

	return new Response(svg, {
		headers: {
			'Content-Type': 'image/svg+xml',
			'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
			'X-Content-Type-Options': 'nosniff'
		}
	});
};
