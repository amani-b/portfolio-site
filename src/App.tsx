import { useEffect, useState } from 'react';
import { nav, profile } from './data/profile';
import { Link, ROUTES, usePath } from './lib/router';
import { cn } from './lib/utils';

// Sections
import Hero from './components/Hero';
import Background from './components/Background';
import Projects from './components/Projects';
import ProjectsPage from './components/ProjectsPage';
import About from './components/About';
import BottomNav from './components/BottomNav';
import ThemeToggle from './components/ThemeToggle';

/** Read once at module load. `new Date()` during render is an impure call. */
const YEAR = new Date().getFullYear();

/**
 * The shell: nav, the current route, and the colophon.
 *
 * There are two routes. `/` is the scrollytelling page it always was; `/projects`
 * is the index, which the old site had as a route of its own and this app did
 * not. Routing is the hand-rolled `lib/router` — see the note there for why a
 * library was not worth its weight here.
 *
 * The desktop nav is a page-and-section nav: four of its five items scroll to a
 * section of the home page (carrying `/#id` so they work from either route) and
 * one, Index, is a page. The phone has no top nav at all — navigation lives in
 * the floating pill — so the theme switch rides in the pill there and on the nav
 * baseline here.
 *
 * Two other things are load-bearing and easy to undo by accident:
 *
 *  · Links carry `aria-current`, so the active destination is exposed rather than
 *    implied by colour alone.
 *  · The section observer uses a thin band across the middle of the viewport, not
 *    a fractional threshold. `threshold: 0.3` fired on every tall section that
 *    happened to be 30% visible and made the highlight jump.
 *
 * Reduced motion is handled entirely in CSS (index.css), so there is no runtime
 * animation library to configure.
 */
export default function App() {
  const path = usePath();
  const isProjects = path === ROUTES.projects;

  const [activeSection, setActiveSection] = useState<string>('home');
  const [scrolled, setScrolled] = useState(false);

  /*
   * The scroll spy only exists on the home page: on `/projects` there are no
   * `section[id]` elements to observe, and the nav's active item is the route
   * itself. Re-running on `isProjects` is what keeps the observer from holding a
   * disconnected list of sections after a navigation.
   */
  useEffect(() => {
    if (isProjects) return;
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
  }, [isProjects]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* The head is written once in index.html, so the route has to retitle it. */
  useEffect(() => {
    document.title = isProjects ? `Index — ${profile.name}` : `${profile.name} — Portfolio`;
  }, [isProjects]);

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
     * dependency. Removing it would leave the scroll position from the previous
     * document — landing halfway down the index after clicking Index.
     */
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
  }, [path]);

  const activeKey = isProjects ? 'index' : activeSection;

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
          <div className="flex items-center gap-6 font-mono text-xs tracking-widest uppercase">
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

      {isProjects ? (
        <main id="main" className="mx-auto max-w-7xl">
          <ProjectsPage />
        </main>
      ) : (
        <main id="main" className="mx-auto max-w-7xl px-6 md:px-12 lg:px-24">
          <Hero id="home" />
          <Background id="background" />
          <Projects id="work" />
          <About id="about" />
        </main>
      )}

      <BottomNav activeKey={activeKey} />

      <footer className="mt-16 border-t border-line px-6 py-8 md:px-12 lg:px-24">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <p className="font-mono text-xs text-muted-foreground">
            © {YEAR} {profile.name}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-xs">
            <Link
              to="/projects"
              className="group -mx-3 min-w-11 px-3 py-3.5 text-center text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="link-underline">Index</span>
            </Link>
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
      </footer>
    </div>
  );
}
