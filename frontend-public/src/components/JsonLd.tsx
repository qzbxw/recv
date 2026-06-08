import React from "react";

interface JsonLdProps {
  schema: object;
}

export function JsonLd({ schema }: JsonLdProps) {
  const json = JSON.stringify(schema).replaceAll("<", "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
