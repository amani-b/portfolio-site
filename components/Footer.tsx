/**
 * Notebook colophon: one large contact line, mono secondary links, and a
 * build note. Mirrors the hero's hierarchy so the page closes the way it opened.
 */
export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto w-full max-w-6xl px-6 py-step-4 md:py-step-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">Contact</p>
        <a
          href="mailto:hello@example.com"
          className="mt-3 inline-block font-display text-2xl font-semibold tracking-tight transition-colors duration-150 hover:text-accent sm:text-4xl"
        >
          hello@example.com
        </a>
        <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-t border-line pt-5 font-mono text-xs text-ink-soft">
          <a
            href="https://github.com/example-username"
            className="transition-colors duration-150 hover:text-accent"
          >
            github.com/example-username
          </a>
          <p>© {new Date().getFullYear()} Alex Carter — built by hand with Next.js</p>
        </div>
      </div>
    </footer>
  );
}
