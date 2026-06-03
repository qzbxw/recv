import { useEffect, useState, FormEvent } from "react";
import { Navigate } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import {
  getStoredAdminToken,
  fetchAdminBlogPosts,
  createAdminBlogPost,
  updateAdminBlogPost,
} from "../lib/api";
import type { AdminBlogPost } from "../lib/types";

export function AdminBlogPage() {
  const token = getStoredAdminToken();
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Editor state
  const [editingPost, setEditingPost] = useState<Partial<AdminBlogPost> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    loadPosts();
  }, [token]);

  async function loadPosts() {
    setLoading(true);
    try {
      const data = await fetchAdminBlogPosts(token!);
      if (Array.isArray(data)) {
        setPosts(data);
      } else if (data && typeof data === "object" && "items" in data) {
        setPosts(data.items || []);
      }
      setError("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
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

  if (!token) {
    return <Navigate replace to="/admin" />;
  }

  if (editingPost) {
    return (
      <main className="admin-shell">
        <div className="admin-noise" />
        <section className="admin-dashboard">
          <header className="admin-topbar">
            <div>
              <span className="admin-eyebrow">recv Admin</span>
              <h1>{editingPost.id ? "Edit Post" : "New Post"}</h1>
            </div>
            <div className="admin-topbar-actions">
              <button
                type="button"
                className="admin-ghost-button"
                onClick={() => setEditingPost(null)}
              >
                Back to list
              </button>
            </div>
          </header>

          <section className="admin-sales-board">
            {error && <div className="admin-error admin-error--inline">{error}</div>}
            
            <form onSubmit={handleSave} className="admin-editor-form">
              <div className="admin-editor-grid">
              <label>
                <span>Title</span>
                <input
                  required
                  value={editingPost.title || ""}
                  onChange={(e) => updateEditingPost({ title: e.target.value })}
                />
              </label>

              <label>
                <span>Slug</span>
                <input
                  required
                  value={editingPost.slug || ""}
                  onChange={(e) => updateEditingPost({ slug: e.target.value })}
                />
              </label>

              <label>
                <span>Status</span>
                <select
                  value={editingPost.status || (editingPost.is_published ? "published" : "draft")}
                  onChange={(e) => updateEditingPost({ status: e.target.value as "draft" | "published", is_published: e.target.value === "published" })}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>

              <label>
                <span>Locale</span>
                <input
                  value={editingPost.locale || "en"}
                  onChange={(e) => updateEditingPost({ locale: e.target.value })}
                />
              </label>

              <label>
                <span>Author</span>
                <input
                  required
                  value={editingPost.author || ""}
                  onChange={(e) => updateEditingPost({ author: e.target.value })}
                />
              </label>

              <label>
                <span>Cover Image URL</span>
                <input
                  value={editingPost.cover_image_url || ""}
                  onChange={(e) => updateEditingPost({ cover_image_url: e.target.value })}
                />
              </label>

              <label className="admin-editor-wide">
                <span>Excerpt</span>
                <textarea
                  required
                  value={editingPost.excerpt || ""}
                  onChange={(e) => updateEditingPost({ excerpt: e.target.value })}
                />
              </label>

              <label>
                <span>Meta title</span>
                <input
                  value={editingPost.meta_title || ""}
                  onChange={(e) => updateEditingPost({ meta_title: e.target.value })}
                />
              </label>

              <label>
                <span>Canonical URL</span>
                <input
                  value={editingPost.canonical_url || ""}
                  onChange={(e) => updateEditingPost({ canonical_url: e.target.value })}
                />
              </label>

              <label className="admin-editor-wide">
                <span>Meta description</span>
                <textarea
                  value={editingPost.meta_description || ""}
                  onChange={(e) => updateEditingPost({ meta_description: e.target.value })}
                />
              </label>

              <label>
                <span>Tags</span>
                <input
                  value={(editingPost.tags || []).join(", ")}
                  onChange={(e) => updateEditingPost({ tags: e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })}
                />
              </label>

              <label>
                <span>Preview token</span>
                <input
                  value={editingPost.preview_token || ""}
                  onChange={(e) => updateEditingPost({ preview_token: e.target.value })}
                />
              </label>

              <label>
                <span>Internal links</span>
                <input
                  inputMode="numeric"
                  value={editingPost.internal_links_count ?? 0}
                  onChange={(e) => updateEditingPost({ internal_links_count: Number(e.target.value) || 0 })}
                />
              </label>

              <label>
                <span>Linking status</span>
                <select
                  value={editingPost.internal_linking_status || "unknown"}
                  onChange={(e) => updateEditingPost({ internal_linking_status: e.target.value })}
                >
                  <option value="unknown">Unknown</option>
                  <option value="needs_links">Needs links</option>
                  <option value="ready">Ready</option>
                  <option value="strong">Strong</option>
                </select>
              </label>
              </div>

              <div className="admin-editor-form__section" data-color-mode="dark">
                <span className="admin-editor-form__label">Content (Markdown)</span>
                <MDEditor
                  value={editingPost.content_md || ""}
                  onChange={(val) => updateEditingPost({ content_md: val || "" })}
                  height={400}
                />
              </div>

              <div className="admin-editor-form__footer">
                <button
                  type="submit"
                  className="admin-login-button admin-login-button--compact"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Post"}
                </button>
              </div>
            </form>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <div className="admin-noise" />
      <section className="admin-dashboard">
        <header className="admin-topbar">
          <div>
            <span className="admin-eyebrow">recv Admin</span>
            <h1>Blog Management</h1>
          </div>
          <div className="admin-topbar-actions">
            <button
              type="button"
              className="admin-ghost-button"
              onClick={loadPosts}
              disabled={loading}
            >
              Refresh
            </button>
            <button
              type="button"
              className="admin-ghost-button"
              onClick={() => setEditingPost({
                title: "",
                slug: "",
                excerpt: "",
                content_md: "",
                cover_image_url: "",
                author: "recv Team",
                is_published: false,
                status: "draft",
                tags: [],
                locale: "en",
                internal_links_count: 0,
                internal_linking_status: "unknown"
              })}
            >
              New Post
            </button>
          </div>
        </header>

        {error && <div className="admin-error admin-error--inline">{error}</div>}

        <section className="admin-sales-board">
          <div className="admin-table-wrap">
            <table className="admin-sales-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Slug</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>SEO</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && posts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="admin-table-empty">Loading posts...</td>
                  </tr>
                ) : posts.length > 0 ? (
                  posts.map((post) => (
                    <tr key={post.id}>
                      <td>
                        <div className="admin-table-primary">
                          <strong>{post.title}</strong>
                        </div>
                      </td>
                      <td>{post.slug}</td>
                      <td>{post.author}</td>
                      <td>
                        <span className={`admin-status-pill ${post.is_published ? "status-paid" : "status-draft"}`}>
                          {post.status === "published" || post.is_published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td>{post.locale || "en"} / {post.internal_linking_status || "unknown"} / {post.internal_links_count ?? 0} links</td>
                      <td>
                        <button
                          type="button"
                          className="admin-ghost-button"
                          onClick={() => setEditingPost(post)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="admin-table-empty">No posts found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
