/**
 * Transcript pipeline stub.
 * For now, validates input and logs. When Supabase is connected,
 * writes to episodes_content.transcript.
 */

export async function attachTranscript(
  showSlug: string,
  episodeNumber: number,
  text: string,
): Promise<{ success: boolean; message: string }> {
  // Validate
  if (!showSlug || !showSlug.trim()) {
    return { success: false, message: "showSlug is required" };
  }
  if (!episodeNumber || episodeNumber < 1) {
    return { success: false, message: "episodeNumber must be >= 1" };
  }
  if (!text || !text.trim()) {
    return { success: false, message: "transcript text is required" };
  }

  const contentSource = process.env.CONTENT_SOURCE || "code";

  if (contentSource === "supabase") {
    // TODO: Write to Supabase episodes_content.transcript
    // const { data, error } = await supabase
    //   .from("episodes_content")
    //   .update({ transcript: text.trim() })
    //   .eq("show_slug", showSlug)
    //   .eq("number", episodeNumber);
    console.log(`[Transcript] Would write to Supabase: ${showSlug} EP${episodeNumber} (${text.length} chars)`);
    return { success: false, message: "Supabase write not yet implemented" };
  }

  // Code source: no write path, just log
  console.log(`[Transcript] Code source — no write path. ${showSlug} EP${episodeNumber} (${text.length} chars)`);
  return { success: false, message: "Code content source has no write path. Switch to CONTENT_SOURCE=supabase." };
}
