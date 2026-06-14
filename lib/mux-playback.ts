// Stub: Mux signed URL generation
// In production, use @mux/mux-node with MUX_TOKEN_ID + MUX_TOKEN_SECRET
// and MUX_SIGNING_KEY_ID + MUX_SIGNING_KEY_PRIVATE for signed URLs

export async function generateSignedPlaybackUrl(
  playbackId: string
): Promise<string> {
  // TODO: implement with real Mux credentials
  // const jwt = Mux.JWT.signPlaybackId(playbackId, { type: 'video', expiration: '1h' });
  // return `https://stream.mux.com/${playbackId}.m3u8?token=${jwt}`;

  return `https://stream.mux.com/${playbackId}.m3u8`; // unsigned stub
}

export async function getPlaybackId(
  seriesSlug: string,
  episodeNumber: number
): Promise<string | null> {
  // TODO: look up from Supabase episodes table
  // For now return null (no real video)
  return null;
}
