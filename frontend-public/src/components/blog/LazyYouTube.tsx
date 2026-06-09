"use client";

import { useState } from "react";

function videoIdFromEmbedUrl(src: string): string | null {
  const match = src.match(/\/embed\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

// Click-to-load YouTube embed: no third-party requests until the visitor
// opts in, which keeps marketing pages free of youtube JS by default.
export function LazyYouTube({ src, language }: { src: string; language: "ru" | "en" }) {
  const [active, setActive] = useState(false);
  const videoId = videoIdFromEmbedUrl(src);
  if (!videoId) return null;

  if (active) {
    return (
      <div className="my-7 rounded-2xl overflow-hidden border border-white/10 aspect-video">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      className="group relative my-7 block w-full rounded-2xl overflow-hidden border border-white/10 aspect-video cursor-pointer"
      aria-label={language === "ru" ? "Воспроизвести видео" : "Play video"}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
      />
      <span className="absolute inset-0 grid place-items-center">
        <span className="w-16 h-16 rounded-full bg-black/70 border border-white/30 grid place-items-center text-white text-2xl pl-1 group-hover:scale-110 transition-transform">
          ▶
        </span>
      </span>
    </button>
  );
}
