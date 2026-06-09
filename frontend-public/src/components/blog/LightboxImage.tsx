"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

// Article image with a zero-dependency fullscreen lightbox. Images with
// known intrinsic dimensions render through next/image (no layout shift);
// legacy external URLs fall back to a plain img.
export function LightboxImage({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <>
      <figure className="my-7">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full cursor-zoom-in rounded-2xl overflow-hidden border border-white/10 hover:border-white/25 transition-colors"
          aria-label={alt ? `${alt} — open full size` : "Open image full size"}
        >
          {width > 0 && height > 0 ? (
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              sizes="(max-width: 768px) 100vw, 768px"
              loading="lazy"
              className="w-full h-auto"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt} loading="lazy" className="w-full h-auto" />
          )}
        </button>
        {alt && <figcaption className="mt-2 text-center text-sm text-white/40">{alt}</figcaption>}
      </figure>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt || "Image"}
          className="fixed inset-0 z-[200] grid place-items-center bg-black/90 backdrop-blur-sm p-4 cursor-zoom-out"
          onClick={close}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="max-h-[92vh] max-w-[94vw] w-auto h-auto rounded-xl" />
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white text-lg leading-none hover:bg-white/20 transition-colors"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
