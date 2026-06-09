import { useEffect, useRef, useState } from "react";
import { fetchAdminMedia, uploadAdminMedia, updateAdminMediaAlt, deleteAdminMedia } from "../../lib/api";
import type { AdminMedia } from "../../lib/types";

export function MediaLibraryModal({
  token,
  onSelect,
  onClose,
}: {
  token: string;
  onSelect: (media: AdminMedia) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<AdminMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingAlt, setPendingAlt] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchAdminMedia(token);
      setItems(data.items || []);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(file: File) {
    if (!pendingAlt.trim()) {
      setError("Describe the image first: alt text is required for every upload.");
      return;
    }
    setUploading(true);
    try {
      const media = await uploadAdminMedia(token, file, pendingAlt.trim());
      setPendingAlt("");
      setError("");
      await load();
      onSelect(media);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSelect(media: AdminMedia) {
    if (!media.alt_text.trim()) {
      const alt = window.prompt("Alt text is required before this image can be used:", "");
      if (!alt || !alt.trim()) return;
      try {
        const updated = await updateAdminMediaAlt(token, media.id, alt.trim());
        setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        onSelect(updated);
      } catch (err) {
        setError((err as Error).message);
      }
      return;
    }
    onSelect(media);
  }

  async function handleDelete(media: AdminMedia) {
    if (!window.confirm(`Delete ${media.original_name}? Only unused files can be removed.`)) return;
    try {
      await deleteAdminMedia(token, media.id);
      setItems((current) => current.filter((item) => item.id !== media.id));
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="admin-media-overlay" role="dialog" aria-modal="true" aria-label="Media library">
      <div className="admin-media-modal dev-card">
        <header className="admin-media-modal__header">
          <h3>Media library</h3>
          <button type="button" className="dev-btn dev-btn--secondary dev-btn--compact" onClick={onClose}>Close</button>
        </header>

        {error && <div className="alert" onClick={() => setError("")}>{error}</div>}

        <div className="admin-media-upload">
          <input
            className="dev-input"
            placeholder="Alt text for the new image (required)"
            value={pendingAlt}
            onChange={(e) => setPendingAlt(e.target.value)}
            disabled={uploading}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className="dev-btn dev-btn--primary dev-btn--compact"
            disabled={uploading || !pendingAlt.trim()}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "Uploading…" : "Upload image"}
          </button>
        </div>

        <div className="admin-media-grid">
          {loading ? (
            <div className="dev-portal__empty-large">Loading media…</div>
          ) : items.length === 0 ? (
            <div className="dev-portal__empty-large">No media yet. Upload the first image above.</div>
          ) : (
            items.map((media) => (
              <figure key={media.id} className="admin-media-item">
                <button type="button" className="admin-media-item__preview" onClick={() => void handleSelect(media)} title="Insert this image">
                  <img src={media.url} alt={media.alt_text || media.original_name} loading="lazy" width={media.width} height={media.height} />
                </button>
                <figcaption className="admin-media-item__meta">
                  <span className="admin-media-item__name" title={media.original_name}>{media.original_name}</span>
                  <span className="admin-media-item__dims">{media.width}×{media.height}{media.alt_text ? "" : " · no alt"}</span>
                  <button type="button" className="dev-btn dev-btn--secondary dev-btn--compact" onClick={() => void handleDelete(media)}>Delete</button>
                </figcaption>
              </figure>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
