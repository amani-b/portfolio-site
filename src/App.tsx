import { useEffect, useState } from 'react';
import { nav, profile } from './data/profile';
import { cn } from './lib/utils';

// Sections
import Hero from './components/Hero';
import Background from './components/Background';
import Projects from './components/Projects';
import About from './components/About';
import BottomNav from './components/BottomNav';

/** Read once at module load. `new Date()` during render is an impure call. */
const YEAR = new Date().getFullYear();

/**
 * The single-page shell.
 *
 * Composition is unchanged from the redesign — floating bottom nav on phones, a
 * fixed mono nav on desktops. Three things were repaired:
 *
 *  · The nav previously had no surface and used `mix-blend-difference`, so
 *    scrolled content ran straight through the labels. It now gains a
 *    translucent backdrop once you leave the hero.
 *  · Links carry `aria-current`, so the active section is exposed rather than
 *    implied by colour alone.
 *  · The section observer used `threshold: 0.3`, which fired on every tall
 *    section that happened to be 30% visible and made the highlight jump. A thin
 *    band across the middle of the viewport is what actually reads as "current".
 *
 * Reduced motion is handled entirely in CSS (index.css), so there is no runtime
 * animation library to configure.
 */
export default function App() {
  const [activeSection, setActiveSection] = useState<string>('home');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const sections = document.querySelectorAll('section[id]');
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
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="bottom-nav-clearance relative min-h-screen selection:bg-white/20">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:text-black"
      >
        Skip to content
      </a>

      <nav
        aria-label="Primary"
        className={cn(
          'fixed top-0 z-50 hidden w-full transition-colors duration-300 md:block',
          scrolled
            ? 'border-b border-white/10 bg-background/85 backdrop-blur-xl'
            : 'border-b border-transparent',
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-12 lg:px-24">
          <a
            href="#home"
            className="-my-2 py-2 font-mono text-sm font-medium tracking-tight text-foreground transition-colors hover:text-white/70"
          >
            {profile.name}
          </a>
          <div className="flex items-center gap-6 font-mono text-xs tracking-widest uppercase">
            {nav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={activeSection === item.id ? 'location' : undefined}
                className={cn(
                  /* -my-2 + py-2 grows the hit area to 32px without
                     changing the nav's height by a pixel. */
                  '-my-2 py-2 transition-colors hover:text-foreground',
                  activeSection === item.id ? 'text-foreground' : 'text-foreground-dim',
                )}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <main id="main" className="mx-auto max-w-7xl px-6 md:px-12 lg:px-24">
        <Hero id="home" />
        <Background id="background" />
        <Projects id="projects" />
        <About id="about" />
      </main>

      <BottomNav activeSection={activeSection} />

      <footer className="mt-16 border-t border-white/10 px-6 py-8 md:px-12 lg:px-24">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <p className="font-mono text-xs text-muted-foreground">
            © {YEAR} {profile.name}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-xs">
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
