import fs from "fs";
import path from "path";
import matter from "gray-matter";

const docsDirectory = path.join(process.cwd(), "content/docs");

export function getDocBySlug(slug: string[], locale: string) {
  const fullPath = path.join(docsDirectory, locale, ...slug) + ".mdx";
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);
  return { data, content };
}

export function getAllDocSlugs(locale: string) {
  const localeDir = path.join(docsDirectory, locale);
  if (!fs.existsSync(localeDir)) return [];
  
  const walk = (dir: string, prefix: string[] = []): string[][] => {
    const files = fs.readdirSync(dir);
    let slugs: string[][] = [];
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        slugs = [...slugs, ...walk(fullPath, [...prefix, file])];
      } else if (file.endsWith(".mdx")) {
        slugs.push([...prefix, file.replace(/\.mdx$/, "")]);
      }
    }
    return slugs;
  };

  return walk(localeDir);
}
