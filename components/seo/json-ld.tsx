type JsonLdValue = Record<string, unknown> | null | undefined | false;

/**
 * Renders one or more JSON-LD blocks. `<` is escaped so stored content
 * (titles, descriptions) can never close the script tag.
 */
export function JsonLd({ data }: { data: JsonLdValue | JsonLdValue[] }) {
  const items = (Array.isArray(data) ? data : [data]).filter((item): item is Record<string, unknown> => Boolean(item));
  return (
    <>
      {items.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item).replace(/</g, "\\u003c") }}
        />
      ))}
    </>
  );
}
