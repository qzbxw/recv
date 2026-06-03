import React from "react";
import Link from "next/link";
import { JsonLd } from "./JsonLd";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  locale?: string;
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://recv.money").replace(/\/+$/, "");
  
  const breadcrumbListSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": `${baseUrl}${item.href}`
    }))
  };

  return (
    <nav aria-label="Breadcrumb" className="flex mb-4 text-sm text-gray-500">
      <JsonLd schema={breadcrumbListSchema} />
      <ol className="flex list-none p-0">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && <span className="mx-2">/</span>}
            {index === items.length - 1 ? (
              <span className="font-semibold text-gray-900" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className="hover:text-blue-600 transition-colors">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
