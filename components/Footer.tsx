/**
 * Notebook colophon: one large contact line, mono secondary links, and a
 * build note. Mirrors the hero's hierarchy so the page closes the way it opened.
 */
export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto w-full max-w-6xl px-5 py-step-4 md:px-6 md:py-step-5">
        <p className="font-mono text-[11px] tracking-[0.18em] text-ink-soft uppercase">Contact</p>
        {/*
          `mt-1` + `py-2` reads as the original `mt-3` but gives the address a
          44px thumb target; the row below compensates with `mt-4` so the
          colophon's rhythm is byte-identical on every screen.
        */}
        <a
          href="mailto:amanuelberhanu.2052@gmail.com"
          className="press mt-1 inline-block py-2 font-display text-[1.15rem] font-semibold tracking-tight [overflow-wrap:anywhere] transition-colors duration-150 hover:text-accent sm:text-4xl"
        >
          amanuelberhanu.2052@gmail.com
        </a>
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-t border-line pt-5 font-mono text-xs text-ink-soft">
          <a
            href="https://github.com/amani-b"
            className="press -my-3.5 inline-block py-3.5 transition-colors duration-150 hover:text-accent"
          >
            github.com/amani-b
          </a>
          <p>© {new Date().getFullYear()} Amanuel Berhanu — built by hand with Next.js</p>
        </div>
      </div>
    </footer>
  );
}
