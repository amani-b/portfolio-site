import { useEffect, useState } from 'react';
import { nav, profile } from './data/profile';
import { getAllProjects } from './data/projects';
import { Link, redirect, usePath, useProjectSlug } from './lib/router';
import { cn } from './lib/utils';

// Sections
import Hero from './components/Hero';
import Background from './components/Background';
import Projects from './components/Projects';
import ProjectDetail from './components/ProjectDetail';
import About from './components/About';
import BottomNav from './components/BottomNav';
import ThemeToggle from './components/ThemeToggle';

/** Read once at module load. `new Date()` during render is an impure call. */
const YEAR = new Date().getFullYear();

/**
 * The shell: nav, the current document, and the colophon.
 *
 * Home (`/`) is the scrollytelling page; each project has its own detail
 * document at `/projects/<slug>`, reached from the Work browser. A dead URL —
 * bare `/projects`, an unknown slug — renders home immediately while an effect
 * silently swaps the URL, so there is never a blank flash and never a junk
 * history entry.
 *
 * The desktop nav is four section links carrying `/#id`, so the same nav
 * works from a detail page: the router navigates home, then the hash effect
 * below scrolls to the section the hash names.
 *
 * Two other things are load-bearing and easy to undo by accident:
 *
 *  · Links carry `aria-current`, so the active destination is exposed rather than
 *    implied by colour alone. On a detail page the active item is Work.
 *  · The section observer uses a thin band across the middle of the viewport, not
 *    a fractional threshold. `threshold: 0.3` fired on every tall section that
 *    happened to be 30% visible and made the highlight jump.
 *
 * Reduced motion is handled entirely in CSS (index.css), so there is no runtime
 * animation library to configure.
 */
export default function App() {
  const path = usePath();
  const slug = useProjectSlug();

  const projects = getAllProjects();
  const project = slug ? (projects.find((entry) => entry.slug === slug) ?? null) : null;

  const isHome = path === '/';
  const isDetail = project !== null;
  /* Dead URLs render home at once; the effect below fixes the address bar. */
  const showHome = isHome || !isDetail;

  const [activeSection, setActiveSection] = useState<string>('home');
  const [scrolled, setScrolled] = useState(false);

  /*
   * The scroll spy only exists on home: a detail page has no `section[id]`
   * elements to observe. Re-running on `showHome` keeps the observer from
   * holding a disconnected list after a navigation.
   */
  useEffect(() => {
    if (!showHome) return;
    const sections = document.querySelectorAll('section[id]');
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [showHome]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Dead URLs become `/` without a history entry — the back button skips them. */
  useEffect(() => {
    if (!isHome && !isDetail) redirect('/');
  }, [isHome, isDetail]);

  /* The head is written once in index.html, so the document has to retitle it. */
  useEffect(() => {
    document.title =
      isDetail && project ? `${project.title} — ${profile.name}` : `${profile.name} — Portfolio`;
  }, [isDetail, project]);

  /*
   * A route change lands at the top of the new document; a route change that
   * carries a hash lands on the section it names. `behavior: "instant"` is
   * required, not decorative: `scroll-behavior: smooth` is set on <html>, so the
   * default here would animate the whole way up from wherever the reader was.
   */
  useEffect(() => {
    if (window.location.hash) {
      const frame = window.requestAnimationFrame(() => {
        document.querySelector(window.location.hash)?.scrollIntoView({ block: 'start' });
      });
      return () => window.cancelAnimationFrame(frame);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    /*
     * `path` is a deliberate re-run trigger, not a value this effect reads: the
     * body only needs to run when the route changes, and the route is the
     * dependency.
     */
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
  }, [path]);

  const activeKey = showHome ? activeSection : 'work';

  return (
    <div className="bottom-nav-clearance relative min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:text-background"
      >
        Skip to content
      </a>

      <nav
        aria-label="Primary"
        className={cn(
          'fixed top-0 z-50 hidden w-full transition-colors duration-300 md:block',
          scrolled
            ? 'border-b border-line bg-background/85 backdrop-blur-xl'
            : 'border-b border-transparent',
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-12 lg:px-24">
          <Link
            to="/#home"
            className="-my-2 py-2 font-mono text-sm font-medium tracking-tight text-foreground transition-colors hover:text-muted-foreground"
          >
            {profile.name}
          </Link>
          <div className="flex items-center gap-6 font-mono text-xs tracking-[0.18em] uppercase">
            {nav.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                aria-current={activeKey === item.id ? 'location' : undefined}
                className={cn(
                  /* -my-2 + py-2 grows the hit area to 32px without
                     changing the nav's height by a pixel. */
                  '-my-2 py-2 transition-colors hover:text-foreground',
                  activeKey === item.id ? 'text-foreground' : 'text-foreground-dim',
                )}
              >
                {item.label}
              </Link>
            ))}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {showHome ? (
        <main id="main" className="mx-auto max-w-7xl px-6 md:px-12 lg:px-24">
          <Hero id="home" />
          <Background id="background" />
          <Projects id="work" />
          <About id="about" />
        </main>
      ) : (
        <main id="main" className="mx-auto max-w-7xl px-6 md:px-12 lg:px-24">
          {project ? <ProjectDetail project={project} /> : null}
        </main>
      )}

      <BottomNav activeKey={activeKey} />

      <footer className="mt-16 border-t border-line px-6 py-16 md:px-12 md:py-20 lg:px-24">
        <div className="mx-auto max-w-7xl">
          <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
            04 — Next step
          </p>
          <a
            href={`mailto:${profile.contact.email}`}
            className="group mt-4 block max-w-3xl text-4xl leading-[1.05] font-medium tracking-tight text-balance text-foreground md:text-6xl"
          >
            Let&apos;s build something that{' '}
            <span className="link-underline">ships to production</span>
            <span aria-hidden="true" className="text-accent">
              .
            </span>
          </a>
          <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-line pt-8 md:flex-row md:items-center">
            <p className="font-mono text-xs text-muted-foreground">
              © {YEAR} {profile.name}
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs">
              <a
                href={profile.contact.github.url}
                target="_blank"
                rel="noreferrer"
                className="py-3.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                {profile.contact.github.label}
              </a>
              <span className="text-muted-foreground">{profile.colophon}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
