import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

function parseArticles(content) {
  // Split input by ARTICLE separator
  const articleBlocks = content.split(/## ARTICLE \d+ — [A-Z]+/i);
  const articles = [];

  for (const block of articleBlocks) {
    if (!block.trim()) continue;

    // Find the text block (metadata)
    const textMatch = block.match(/```text\r?\n([\s\S]*?)```/);
    if (!textMatch) continue;

    const metadataText = textMatch[1];
    const metadata = {};
    for (const line of metadataText.split(/\r?\n/)) {
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) continue;
      const key = line.slice(0, colonIndex).trim();
      const val = line.slice(colonIndex + 1).trim();
      metadata[key] = val;
    }

    // Find the markdown block
    const markdownMatch = block.match(/```markdown\r?\n([\s\S]*?)```/);
    let markdownContent = "";
    if (markdownMatch) {
      markdownContent = markdownMatch[1];
    } else {
      // Fallback: try to find markdown block starting after metadata
      const textBlockEnd = block.indexOf("```", block.indexOf("```text") + 7);
      if (textBlockEnd !== -1) {
        const remaining = block.slice(textBlockEnd + 3).trim();
        if (remaining.startsWith("```markdown")) {
          markdownContent = remaining.slice(11).replace(/```$/, "").trim();
        } else {
          markdownContent = remaining;
        }
      }
    }

    if (!metadata.Slug || !metadata.Locale) {
      console.warn("Skipping block due to missing Slug or Locale in metadata");
      continue;
    }

    articles.push({
      metadata,
      body: markdownContent,
    });
  }

  return articles;
}

function processArticle({ metadata, body }) {
  const slug = metadata.Slug;
  const locale = metadata.Locale.toLowerCase();
  const title = metadata.Title;
  const excerpt = metadata.Excerpt;
  const metaDescription = metadata["Meta description"];
  const publishedAt = new Date().toISOString().split("T")[0] + "T12:00:00Z";
  const tags = metadata.Tags ? metadata.Tags.split(",").map(t => t.trim()) : [];

  // Automatically insert internal links
  let updatedBody = body;
  const linksToAdd = metadata["Internal links to add"];
  if (linksToAdd) {
    const instructions = linksToAdd.split(",").map(s => s.trim());
    for (const inst of instructions) {
      const parts = inst.split("→").map(s => s.trim());
      if (parts.length !== 2) continue;
      const [phrase, target] = parts;
      // Escape special regex chars
      const escapedPhrase = phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      // Match phrase if not already in markdown link
      const regex = new RegExp(`(?<!\\[)${escapedPhrase}(?!\\])`, "g");
      updatedBody = updatedBody.replace(regex, `[${phrase}](${target})`);
    }
  }

  // Parse sections
  const sections = [];
  const parts = updatedBody.split(/\r?\n##\s+/);
  
  // The first part is everything before the first H2
  const intro = parts[0].trim();
  if (intro && !intro.startsWith("##")) {
    const cleanedIntro = intro.replace(/\r?\n---\r?\n$/, "").trim();
    if (cleanedIntro) {
      const introHeading = locale === "ru" ? "Введение" : "Introduction";
      sections.push([introHeading, cleanedIntro]);
    }
  }

  for (let i = 1; i < parts.length; i++) {
    const sectionText = parts[i];
    const lines = sectionText.split(/\r?\n/);
    const heading = lines[0].trim();
    const bodyText = lines.slice(1).join("\n").trim();
    sections.push([heading, bodyText]);
  }

  return {
    slug,
    locale,
    title,
    excerpt,
    meta_description: metaDescription,
    published_at: publishedAt,
    tags,
    sections,
  };
}

function main() {
  const args = process.argv.slice(2);
  let content = "";

  if (args.length > 0) {
    const filePath = path.resolve(args[0]);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    content = fs.readFileSync(filePath, "utf8");
  } else {
    // Read from stdin
    content = fs.readFileSync(0, "utf-8");
  }

  const parsed = parseArticles(content);
  if (parsed.length === 0) {
    console.error("No valid articles found in input.");
    process.exit(1);
  }

  const sourcePath = path.join(root, "content/blog/articles.json");
  let articlesList = [];
  if (fs.existsSync(sourcePath)) {
    articlesList = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  }

  for (const raw of parsed) {
    const article = processArticle(raw);
    
    // Validations
    if (article.meta_description.length < 120 || article.meta_description.length > 160) {
      console.warn(`[Warning] ${article.slug}:${article.locale} meta_description is ${article.meta_description.length} characters (expected 120-160)`);
    }
    if (article.sections.length < 4) {
      console.warn(`[Warning] ${article.slug}:${article.locale} has ${article.sections.length} sections (expected at least 4)`);
    }

    const existingIndex = articlesList.findIndex(
      a => a.slug === article.slug && a.locale === article.locale
    );

    if (existingIndex !== -1) {
      articlesList[existingIndex] = article;
      console.log(`Updated article: ${article.slug} (${article.locale})`);
    } else {
      articlesList.push(article);
      console.log(`Added article: ${article.slug} (${article.locale})`);
    }
  }

  fs.writeFileSync(sourcePath, JSON.stringify(articlesList, null, 2) + "\n");
  console.log(`Successfully wrote to ${sourcePath}`);
}

main();
