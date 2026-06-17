#!/usr/bin/env tsx
/**
 * CLI to attach a transcript to an episode.
 * Usage: npx tsx scripts/attach-transcript.ts <show-slug> <episode-number> <transcript-file>
 * Example: npx tsx scripts/attach-transcript.ts the-blackthornes 1 ./transcripts/blackthornes-ep1.txt
 */

import { readFileSync } from "fs";
import { attachTranscript } from "../lib/content/transcripts";

const [,, showSlug, epStr, filePath] = process.argv;

if (!showSlug || !epStr || !filePath) {
  console.error("Usage: npx tsx scripts/attach-transcript.ts <show-slug> <episode-number> <transcript-file>");
  process.exit(1);
}

const text = readFileSync(filePath, "utf-8");
console.log(`Attaching transcript: ${showSlug} EP${epStr} (${text.length} chars)`);

attachTranscript(showSlug, parseInt(epStr, 10), text).then((result) => {
  console.log(result.success ? "Success!" : `Failed: ${result.message}`);
  process.exit(result.success ? 0 : 1);
});
