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
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
