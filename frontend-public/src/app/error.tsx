"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="lend-page min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[80%] bg-radial-gradient from-rose-500/15 via-accent/10 to-transparent blur-[120px] opacity-45 animate-pulse" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      </div>
      <section className="min-h-screen grid place-items-center px-6 text-center relative z-10">
        <div className="max-w-2xl">
          <span className="lend-section-kicker justify-center mx-auto">ERROR</span>
          <h1 className="mt-6 text-5xl md:text-7xl font-black tracking-tighter leading-[0.95] font-['Montserrat'] bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent">
            Something failed
          </h1>
          <p className="mt-6 text-base md:text-lg text-white/55 leading-relaxed">
            Retry the page or return to Reqst documentation.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <button type="button" className="lend-primary px-9 py-4 rounded-2xl font-bold" onClick={reset}>Retry</button>
            <Link href="/en/docs" className="lend-secondary px-9 py-4 rounded-2xl font-bold">Docs</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
