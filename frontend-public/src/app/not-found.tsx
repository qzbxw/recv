import Link from "next/link";

export default function NotFound() {
  return (
    <main className="lend-page min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[80%] bg-radial-gradient from-accent/20 via-transparent to-transparent blur-[120px] opacity-40 animate-pulse" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      </div>
      <section className="min-h-screen grid place-items-center px-6 text-center relative z-10">
        <div className="max-w-2xl">
          <span className="lend-section-kicker justify-center mx-auto">404</span>
          <h1 className="mt-6 text-5xl md:text-7xl font-black tracking-tighter leading-[0.95] font-['Montserrat'] bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent">
            Page not found
          </h1>
          <p className="mt-6 text-base md:text-lg text-white/55 leading-relaxed">
            The requested recv page does not exist or has moved.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/en" className="lend-primary px-9 py-4 rounded-2xl font-bold">Home</Link>
            <Link href="/en/docs" className="lend-secondary px-9 py-4 rounded-2xl font-bold">Docs</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
