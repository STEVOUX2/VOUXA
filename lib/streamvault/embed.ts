const STREAMVAULT_BASE = process.env.NEXT_PUBLIC_STREAMVAULT_BASE_URL || 'https://streamvaultsrc.click';

export function getEmbedUrl(tmdbId: number): string {
  return `${STREAMVAULT_BASE}/embed/movie/${tmdbId}`;
}

export function getEmbedConfig() {
  return {
    allowFullscreen: true,
    allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
    referrerPolicy: 'no-referrer' as const,
    sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups allow-presentation',
  };
}
