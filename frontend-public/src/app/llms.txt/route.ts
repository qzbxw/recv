import { getAllDocSlugs } from "@/lib/docs";

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://recv.money";
  
  // Try to gather documentation slugs for linking
  let docsLinks = "";
  try {
    const enSlugs = getAllDocSlugs("en");
    docsLinks = enSlugs
      .map(slugParts => {
        const slug = slugParts.join("/");
        return `- [${slug}](${siteUrl}/en/docs/${slug})`;
      })
      .join("\n");
  } catch (e) {
    console.error("Failed to list docs for llms.txt:", e);
  }

  const content = `# recv LLM Guide

recv is a cryptocurrency payment gateway focused on Telegram bots and SaaS billing.

## Key Features
- **One-click Checkout**: Fast payment flow for users.
- **TON & TRON Support**: USDT and native token support on multiple networks.
- **Webhook Integration**: Reliable payment notifications.
- **Non-custodial core**: Direct-to-wallet transfers.

## Core API Endpoints
- **Create Invoice**: POST /v1/invoices
- **Get Invoice**: GET /v1/invoices/:id
- **List Invoices**: GET /v1/invoices
- **Simulate Payment (Test Mode)**: POST /v1/test/invoices/:id/simulate-payment

## Machine Readable Assets
- OpenAPI Spec: ${siteUrl}/openapi.json
- Raw Documentation: ${siteUrl}/en/docs/raw/[slug]

## Documentation
${docsLinks || "- [Introduction](${siteUrl}/en/docs/introduction)"}

## Authentication
Use API Key in Header: \`X-API-Key: your_key_here\`
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
