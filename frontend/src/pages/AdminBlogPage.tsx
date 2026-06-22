import { lazy, Suspense, useEffect, useMemo, useState, FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  getStoredAdminToken,
  fetchAdminBlogPosts,
  createAdminBlogPost,
  updateAdminBlogPost,
  deleteAdminBlogPost,
} from "../lib/api";
import { marked } from "marked";
import { CustomSelect } from "../components/CustomSelect";
import type { AdminBlogPost } from "../lib/types";

const TipTapEditor = lazy(() => import("../features/blog/TipTapEditor"));
const MediaLibraryModal = lazy(() =>
  import("../features/blog/MediaLibraryModal").then((m) => ({ default: m.MediaLibraryModal })),
);

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
];

const LINKING_OPTIONS = [
  { value: "unknown", label: "Unknown" },
  { value: "needs_links", label: "Needs links" },
  { value: "ready", label: "Ready" },
  { value: "strong", label: "Strong" },
];

// Locales an article can be translated into. A "translation" is simply another
// post row sharing the same slug with a different locale.
const LOCALES = ["en", "ru"] as const;
type Locale = (typeof LOCALES)[number];

function localeOf(post: Partial<AdminBlogPost>): string {
  return post.locale || "en";
}

function blankTranslation(base: Partial<AdminBlogPost>, locale: string): Partial<AdminBlogPost> {
  return {
    title: "",
    h1: "",
    slug: base.slug || "",
    excerpt: "",
    content_md: "",
    cover_image_url: base.cover_image_url || "",
    author: base.author || "Recv Core Team",
    author_slug: base.author_slug || "recv-core",
    is_published: false,
    status: "draft",
    tags: base.tags || [],
    locale,
    meta_title: "",
    meta_description: "",
    canonical_url: "",
    og_title: "",
    og_description: "",
    og_image_url: "",
    cover_image_alt: "",
    robots_index: true,
    robots_follow: true,
    include_in_sitemap: true,
    content_version: 1,
    internal_links_count: 0,
    internal_linking_status: "unknown",
  };
}

// Legacy posts store Markdown; the rich editor bootstraps from its HTML
// rendering. Structured JSON becomes authoritative on the first save.
function markdownToHTML(md: string): string {
  return marked.parse(md, { async: false, gfm: true, breaks: false });
}

function LegacyMarkdownEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const previewHTML = useMemo(() => markdownToHTML(value), [value]);

  return (
    <div className="admin-markdown-editor">
      <textarea
        className="dev-input admin-markdown-editor__input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck
      />
      <div className="admin-markdown-editor__preview" aria-label="Markdown preview">
        <div className="admin-markdown-editor__preview-inner" dangerouslySetInnerHTML={{ __html: previewHTML }} />
      </div>
    </div>
  );
}

function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
  if (!window.matchMedia("(hover: hover)").matches) return;
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
}

function BlogShell({ title, subtitle, actions, error, onDismissError, children }: {
  title: string;
  subtitle: string;
  actions: React.ReactNode;
  error: string;
  onDismissError: () => void;
  children: React.ReactNode;
}) {
  return (
    <main className="dev-portal admin-blog">
      <div className="dev-portal__backdrop dev-portal__backdrop--grid" />
      <div className="admin-blog__shell">
        <header className="dev-portal__header portal-animate-in admin-blog__header">
          <div className="admin-blog__brand">
            <Link to="/" style={{ textDecoration: "none" }}><strong>recv<span className="brand-dot">.</span></strong></Link>
            <span className="dev-api-badge dev-api-badge--post dev-api-badge--micro">Content</span>
          </div>
          <div className="dev-portal__header-actions">{actions}</div>
        </header>
        <div className="dev-portal__body admin-blog__body">
          <div className="dev-portal__section-header">
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          {error && <div className="alert portal-animate-in" onClick={onDismissError}>{error}</div>}
          {children}
        </div>
      </div>
    </main>
  );
}

export function AdminBlogPage() {
  const token = getStoredAdminToken();
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingPost, setEditingPost] = useState<Partial<AdminBlogPost> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCoverLibrary, setShowCoverLibrary] = useState(false);
  // Posts created before TipTap stay on the Markdown editor until the admin
  // explicitly converts them; new posts and v2 posts always use TipTap.
  const [convertedToRich, setConvertedToRich] = useState(false);

  // Group rows by slug: each group is one article with its locale translations.
  const groups = useMemo(() => {
    const map = new Map<string, AdminBlogPost[]>();
    for (const post of posts) {
      const arr = map.get(post.slug) ?? [];
      arr.push(post);
      map.set(post.slug, arr);
    }
    return Array.from(map.values());
  }, [posts]);

  useEffect(() => {
    if (!token) return;
    void loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadPosts() {
    setLoading(true);
    try {
      const pageSize = 100;
      const firstPage = await fetchAdminBlogPosts(token!, 1, pageSize);
      if (Array.isArray(firstPage)) {
        setPosts(firstPage);
      } else {
        const total = firstPage.total ?? firstPage.items.length;
        const all = [...(firstPage.items || [])];
        const pages = Math.ceil(total / pageSize);
        for (let page = 2; page <= pages; page += 1) {
          const data = await fetchAdminBlogPosts(token!, page, pageSize);
          if (!Array.isArray(data)) {
            all.push(...(data.items || []));
          }
        }
        setPosts(all);
      }
      setError("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteGroup(group: AdminBlogPost[]) {
    if (!token || group.length === 0) return;
    const primary = group.find((p) => localeOf(p) === "en") ?? group[0];
    const label = primary.title || primary.slug || "this article";
    const locales = group.map((post) => localeOf(post).toUpperCase()).join(", ");
    if (!window.confirm(`Delete "${label}" and its ${group.length} translation row(s): ${locales}? This cannot be undone.`)) {
      return;
    }
    setLoading(true);
    try {
      for (const post of group) {
        await deleteAdminBlogPost(token, post.id);
      }
      await loadPosts();
      setError("");
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!token || !editingPost) return;
    setIsSaving(true);
    try {
      if (editingPost.id) {
        await updateAdminBlogPost(token, editingPost.id, editingPost);
      } else {
        await createAdminBlogPost(token, editingPost);
      }
      setEditingPost(null);
      await loadPosts();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  function updateEditingPost(next: Partial<AdminBlogPost>) {
    setEditingPost((current) => ({ ...(current || {}), ...next }));
  }

  function openPost(post: Partial<AdminBlogPost> | null) {
    setConvertedToRich(false);
    setEditingPost(post);
  }

  if (!token) {
    return <Navigate replace to="/admin" />;
  }

  if (editingPost) {
    const statusValue = editingPost.status || (editingPost.is_published ? "published" : "draft");
    const currentLocale = localeOf(editingPost);
    const siblings = editingPost.slug
      ? posts.filter((p) => p.slug === editingPost.slug)
      : [];
    const siblingByLocale = new Map(siblings.map((p) => [localeOf(p), p]));

    // Rich editor applies to: posts already on structured content (v2),
    // brand-new posts, and legacy posts explicitly converted this session.
    const hasStructured = (editingPost.content_version ?? 1) >= 2 && !!editingPost.content_json;
    const isNewPost = !editingPost.id;
    const useRichEditor = hasStructured || isNewPost || convertedToRich;
    const richInitialContent = hasStructured
      ? (editingPost.content_json as Record<string, unknown>)
      : markdownToHTML(editingPost.content_md || "");

    function switchTranslation(locale: string) {
      if (locale === currentLocale) return;
      const existing = siblingByLocale.get(locale);
      openPost(existing ?? blankTranslation(editingPost!, locale));
    }

    return (
      <BlogShell
        error={error}
        onDismissError={() => setError("")}
        title={editingPost.id ? "Edit post" : "New post"}
        subtitle="Write, optimise and publish content. Markdown supported."
        actions={
          <>
            <button type="button" className="dev-btn dev-btn--secondary dev-btn--compact" onClick={() => setEditingPost(null)}>Back to list</button>
            <button type="submit" form="blog-editor-form" className="dev-btn dev-btn--primary dev-btn--compact" disabled={isSaving}>{isSaving ? "Saving…" : "Save post"}</button>
          </>
        }
      >
        <form id="blog-editor-form" onSubmit={handleSave} className="dev-form portal-animate-in">
          <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
            <div className="console-card-spotlight" />
            <div className="dev-portal__section-header dev-portal__section-header--margin">
              <h3>Translations</h3>
              <p>One article, one slug, multiple locales. Switch a language to edit or create its translation.</p>
            </div>
            <div className="admin-blog-locales">
              {LOCALES.map((loc) => {
                const exists = siblingByLocale.has(loc) || currentLocale === loc;
                const isCurrent = currentLocale === loc;
                return (
                  <button
                    key={loc}
                    type="button"
                    className={`admin-blog-locale-tab${isCurrent ? " admin-blog-locale-tab--active" : ""}${!exists ? " admin-blog-locale-tab--missing" : ""}`}
                    onClick={() => switchTranslation(loc)}
                    disabled={isCurrent}
                    title={exists ? `Edit ${loc.toUpperCase()} version` : `Add ${loc.toUpperCase()} translation`}
                  >
                    <span className="admin-blog-locale-tab__code">{loc.toUpperCase()}</span>
                    <span className="admin-blog-locale-tab__state">{exists ? (isCurrent ? "editing" : "edit") : "+ add"}</span>
                  </button>
                );
              })}
            </div>
            {!editingPost.slug && (
              <p className="admin-blog-locales__hint">Set a slug first, then you can add translations that share it.</p>
            )}
          </div>

          <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
            <div className="console-card-spotlight" />
            <div className="dev-portal__section-header dev-portal__section-header--margin"><h3>Basics</h3></div>
            <div className="admin-blog-grid">
              <div className="dev-input-group">
                <label>Title</label>
                <input className="dev-input" required value={editingPost.title || ""} onChange={(e) => updateEditingPost({ title: e.target.value })} />
              </div>
              <div className="dev-input-group">
                <label>Page H1</label>
                <input className="dev-input" required value={editingPost.h1 || ""} onChange={(e) => updateEditingPost({ h1: e.target.value })} />
              </div>
              <div className="dev-input-group">
                <label>Slug</label>
                <input className="dev-input" required value={editingPost.slug || ""} onChange={(e) => updateEditingPost({ slug: e.target.value })} />
              </div>
              <div className="dev-input-group">
                <label>Status</label>
                <CustomSelect value={statusValue} options={STATUS_OPTIONS} ariaLabel="Status" onChange={(v) => updateEditingPost({ status: v as "draft" | "published", is_published: v === "published" })} />
              </div>
              <div className="dev-input-group">
                <label>Locale</label>
                <CustomSelect value={currentLocale} options={LOCALES.map((l) => ({ value: l, label: l.toUpperCase() }))} ariaLabel="Locale" onChange={(v) => updateEditingPost({ locale: v })} />
              </div>
              <div className="dev-input-group">
                <label>Author</label>
                <input className="dev-input" required value={editingPost.author || ""} onChange={(e) => updateEditingPost({ author: e.target.value })} />
              </div>
              <div className="dev-input-group">
                <label>Author slug</label>
                <input className="dev-input" required value={editingPost.author_slug || "recv-core"} onChange={(e) => updateEditingPost({ author_slug: e.target.value })} />
              </div>
              <div className="dev-input-group">
                <label>Cover image URL</label>
                <div className="admin-blog-cover-row">
                  <input className="dev-input" value={editingPost.cover_image_url || ""} onChange={(e) => updateEditingPost({ cover_image_url: e.target.value })} />
                  <button type="button" className="dev-btn dev-btn--secondary dev-btn--compact" onClick={() => setShowCoverLibrary(true)}>Library</button>
                </div>
              </div>
              <div className="dev-input-group">
                <label>Cover image alt</label>
                <input className="dev-input" value={editingPost.cover_image_alt || ""} onChange={(e) => updateEditingPost({ cover_image_alt: e.target.value })} />
              </div>
              <div className="dev-input-group admin-blog-grid__wide">
                <label>Excerpt</label>
                <textarea className="dev-input" required value={editingPost.excerpt || ""} onChange={(e) => updateEditingPost({ excerpt: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
            <div className="console-card-spotlight" />
            <div className="dev-portal__section-header dev-portal__section-header--margin"><h3>SEO & linking</h3></div>
            <div className="admin-blog-grid">
              <div className="dev-input-group">
                <label>Meta title</label>
                <input className="dev-input" value={editingPost.meta_title || ""} onChange={(e) => updateEditingPost({ meta_title: e.target.value })} />
              </div>
              <div className="dev-input-group">
                <label>Canonical URL</label>
                <input className="dev-input" value={editingPost.canonical_url || ""} onChange={(e) => updateEditingPost({ canonical_url: e.target.value })} />
              </div>
              <div className="dev-input-group admin-blog-grid__wide">
                <label>Meta description</label>
                <textarea className="dev-input" value={editingPost.meta_description || ""} onChange={(e) => updateEditingPost({ meta_description: e.target.value })} />
              </div>
              <div className="dev-input-group">
                <label>OG title</label>
                <input className="dev-input" value={editingPost.og_title || ""} onChange={(e) => updateEditingPost({ og_title: e.target.value })} />
              </div>
              <div className="dev-input-group">
                <label>OG image URL</label>
                <input className="dev-input" value={editingPost.og_image_url || ""} onChange={(e) => updateEditingPost({ og_image_url: e.target.value })} />
              </div>
              <div className="dev-input-group admin-blog-grid__wide">
                <label>OG description</label>
                <textarea className="dev-input" value={editingPost.og_description || ""} onChange={(e) => updateEditingPost({ og_description: e.target.value })} />
              </div>
              <label className="dev-input-group">
                <span>Index page</span>
                <input type="checkbox" checked={editingPost.robots_index ?? true} onChange={(e) => updateEditingPost({ robots_index: e.target.checked })} />
              </label>
              <label className="dev-input-group">
                <span>Follow links</span>
                <input type="checkbox" checked={editingPost.robots_follow ?? true} onChange={(e) => updateEditingPost({ robots_follow: e.target.checked })} />
              </label>
              <label className="dev-input-group">
                <span>Include in sitemap</span>
                <input type="checkbox" checked={editingPost.include_in_sitemap ?? true} onChange={(e) => updateEditingPost({ include_in_sitemap: e.target.checked })} />
              </label>
              <div className="dev-input-group">
                <label>Tags (comma separated)</label>
                <input className="dev-input" value={(editingPost.tags || []).join(", ")} onChange={(e) => updateEditingPost({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />
              </div>
              <div className="dev-input-group">
                <label>Preview token</label>
                <input className="dev-input" value={editingPost.preview_token || ""} onChange={(e) => updateEditingPost({ preview_token: e.target.value })} />
              </div>
              <div className="dev-input-group">
                <label>Internal links</label>
                <input className="dev-input" inputMode="numeric" value={editingPost.internal_links_count ?? 0} onChange={(e) => updateEditingPost({ internal_links_count: Number(e.target.value) || 0 })} />
              </div>
              <div className="dev-input-group">
                <label>Linking status</label>
                <CustomSelect value={editingPost.internal_linking_status || "unknown"} options={LINKING_OPTIONS} ariaLabel="Linking status" onChange={(v) => updateEditingPost({ internal_linking_status: v })} />
              </div>
            </div>
          </div>

          <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
            <div className="console-card-spotlight" />
            {useRichEditor ? (
              <>
                <div className="dev-portal__section-header dev-portal__section-header--margin"><h3>Content</h3><p>Rich text · stored as structured JSON v2</p></div>
                <div className="admin-blog-editor">
                  <Suspense fallback={<div className="dev-portal__empty-large">Loading editor…</div>}>
                    <TipTapEditor
                      key={`${editingPost.id ?? "new"}-${currentLocale}`}
                      token={token}
                      initialContent={richInitialContent}
                      onChange={(doc) => updateEditingPost({ content_json: doc as Record<string, unknown>, content_version: 2 })}
                    />
                  </Suspense>
                </div>
              </>
            ) : (
              <>
                <div className="dev-portal__section-header dev-portal__section-header--margin">
                  <h3>Content</h3>
                  <p>Markdown (legacy). Converting keeps Markdown as a fallback until you save.</p>
                </div>
                <button type="button" className="dev-btn dev-btn--secondary dev-btn--compact admin-blog-convert" onClick={() => setConvertedToRich(true)}>
                  Convert to rich editor
                </button>
                <div className="admin-blog-editor">
                  <LegacyMarkdownEditor
                    value={editingPost.content_md || ""}
                    onChange={(value) => updateEditingPost({ content_md: value })}
                  />
                </div>
              </>
            )}
          </div>

          {showCoverLibrary && (
            <Suspense fallback={null}>
              <MediaLibraryModal
                token={token}
                onClose={() => setShowCoverLibrary(false)}
                onSelect={(media) => {
                  updateEditingPost({ cover_image_url: media.url, cover_image_alt: media.alt_text });
                  setShowCoverLibrary(false);
                }}
              />
            </Suspense>
          )}

          <div className="admin-blog__footer">
            <button type="button" className="dev-btn dev-btn--secondary" onClick={() => setEditingPost(null)}>Cancel</button>
            <button type="submit" className="dev-btn dev-btn--primary" disabled={isSaving}>{isSaving ? "Saving…" : "Save post"}</button>
          </div>
        </form>
      </BlogShell>
    );
  }

  return (
    <BlogShell
      error={error}
      onDismissError={() => setError("")}
      title="Blog management"
      subtitle={`${groups.length} articles · ${posts.length} translations. Create, edit and publish content.`}
      actions={
        <>
          <button type="button" className="dev-btn dev-btn--secondary dev-btn--compact" onClick={() => void loadPosts()} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
          <button
            type="button"
            className="dev-btn dev-btn--primary dev-btn--compact"
            onClick={() => openPost({ title: "", h1: "", slug: "", excerpt: "", content_md: "", content_version: 1, cover_image_url: "", cover_image_alt: "", author: "Recv Core Team", author_slug: "recv-core", is_published: false, status: "draft", tags: [], locale: "en", robots_index: true, robots_follow: true, include_in_sitemap: true, internal_links_count: 0, internal_linking_status: "unknown" })}
          >
            New post
          </button>
        </>
      }
    >
      {loading && posts.length === 0 ? (
        <div className="dev-card dev-portal__empty-large">Loading posts…</div>
      ) : posts.length === 0 ? (
        <div className="dev-card dev-portal__empty-large">No posts yet. Create your first one.</div>
      ) : (
        <div className="dev-resource-list portal-animate-in">
          {groups.map((group) => {
            const primary = group.find((p) => localeOf(p) === "en") ?? group[0];
            const byLocale = new Map(group.map((p) => [localeOf(p), p]));
            const published = primary.status === "published" || primary.is_published;
            return (
              <div key={primary.slug} className="dev-card console-spotlight-card admin-blog-card" onMouseMove={handleMouseMove}>
                <div className="console-card-spotlight" />
                <div className="dev-card__head">
                  <div>
                    <div className="dev-card__status-row">
                      <span className={`dev-api-badge dev-status-badge dev-status-badge--${published ? "success" : "warning"}`}>{published ? "Published" : "Draft"}</span>
                      <span className="dev-api-badge dev-api-badge--secondary dev-api-badge--micro">{primary.internal_linking_status || "unknown"} · {primary.internal_links_count ?? 0} links</span>
                    </div>
                    <h3 className="dev-card__title">{primary.title || "(untitled)"}</h3>
                    <code className="dev-card__id">/{primary.slug}</code>
                    <div className="dev-resource-card__meta admin-blog-card__meta">by {primary.author}{primary.excerpt ? ` — ${primary.excerpt}` : ""}</div>
                    <div className="admin-blog-locales admin-blog-locales--compact">
                      {LOCALES.map((loc) => {
                        const existing = byLocale.get(loc);
                        return (
                          <button
                            key={loc}
                            type="button"
                            className={`admin-blog-locale-tab${existing ? "" : " admin-blog-locale-tab--missing"}`}
                            onClick={() => openPost(existing ?? blankTranslation(primary, loc))}
                            title={existing ? `Edit ${loc.toUpperCase()} version` : `Add ${loc.toUpperCase()} translation`}
                          >
                            <span className="admin-blog-locale-tab__code">{loc.toUpperCase()}</span>
                            <span className="admin-blog-locale-tab__state">{existing ? "edit" : "+ add"}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="dev-card__actions admin-actions">
                    <button type="button" className="dev-btn dev-btn--secondary dev-btn--compact" onClick={() => openPost(primary)}>Edit</button>
                    <button type="button" className="dev-btn dev-btn--danger dev-btn--compact" onClick={() => void handleDeleteGroup(group)}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </BlogShell>
  );
}
