/**
 * Server component that injects JSON-LD structured data into the page.
 *
 * Usage:
 *   <JsonLd data={organizationSchema()} />
 *   <JsonLd data={[organizationSchema(), webSiteSchema()]} />
 */

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

export default function JsonLd({ data }: JsonLdProps) {
  /* JSON.stringify does not escape `<`, and the browser's HTML tokenizer ends a
     <script> block at the first literal `</script` regardless of JSON syntax.
     Every value reaching this component today is catalogue-authored, so nothing
     is exploitable right now — but the whole point of this escape is that it
     stops being true the first time a synopsis, a cast name or a creator-
     supplied field carries the sequence, and that change would look harmless in
     review. Escaping the three characters that can terminate or reopen a
     script context costs nothing and does not alter the parsed JSON, because
     \u003c and friends are the same characters to a JSON parser. */
  const safe = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
