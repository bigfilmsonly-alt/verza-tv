export function getSignedPlaybackUrl(videoId: string): string {
  const keyId = process.env.MUX_SIGNING_KEY_ID;
  const keySecret = process.env.MUX_SIGNING_KEY_SECRET;
  if (!keyId || !keySecret) {
    // Stub: return a placeholder when Mux keys aren't configured
    return `https://stream.mux.com/${videoId}.m3u8`;
  }
  // Real signing would go here with @mux/mux-node JWT signing
  return `https://stream.mux.com/${videoId}.m3u8?token=signed`;
}
