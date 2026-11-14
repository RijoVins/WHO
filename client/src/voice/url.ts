/** A path such as /livekit means "on this website": ws:// on http pages, wss:// on https pages. */
export function resolveVoiceUrl(url: string, loc: Pick<Location, 'protocol' | 'host'> = window.location): string {
  if (!url.startsWith('/')) return url;
  return `${loc.protocol === 'https:' ? 'wss' : 'ws'}://${loc.host}${url}`;
}
