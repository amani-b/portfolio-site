import { ArrowRight, Github, Mail } from 'lucide-react';
import { profile } from '../data/profile';
import { getAllProjects } from '../data/projects';

/**
 * The opening statement — the production-notebook concept starts here.
 *
 * Composition: status pill (availability is factual — `lookingFor` in the
 * data file), headline, intro, actions, then a stat strip computed from the
 * project registry rather than hard-coded, so adding a project updates the
 * hero without touching this component. The blueprint grid + glow are pure
 * decoration (`aria-hidden`, pointer-events-none).
 */
export default function Hero({ id }: { id: string }) {
  const parts = profile.headline.split(profile.headlineRule);
  const hasRule = parts.length === 2;

  const projects = getAllProjects();
  const figures = projects.reduce((sum, p) => sum + p.images.length, 0);
  const stack = new Set(projects.flatMap((p) => p.techStack)).size;
  const stats = [
    { value: String(projects.length).padStart(2, '0'), label: 'Shipped to production' },
    { value: String(figures).padStart(2, '0'), label: 'Documented figures' },
    { value: String(stack).padStart(2, '0'), label: 'Technologies in stack' },
    { value: 'EN·AM', label: 'Assistant speaks' },
  ];

  return (
    <section id={id} className="relative flex min-h-[92svh] flex-col justify-center pt-16 pb-28 md:pt-20 md:pb-0">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="blueprint-grid absolute inset-0 opacity-60" />
        <div className="glow-orb absolute -top-32 left-1/2 h-[28rem] w-[46rem] -translate-x-1/2" />
      </div>

      <div className="rise max-w-3xl">
        <p className="inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/80 py-1.5 pr-4 pl-1.5 font-mono text-xs text-muted-foreground backdrop-blur">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="ping-dot absolute inline-flex h-full w-full rounded-full bg-accent" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          Open to internships &amp; junior roles · {projects[0]?.year ?? ''}
        </p>

        <p className="mt-6 mb-6 font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
          {profile.eyebrow}
        </p>

        <h1 className="text-4xl leading-[1.1] font-medium tracking-tight text-balance text-foreground md:text-6xl lg:text-7xl">
          {hasRule ? (
            <>
              {parts[0]}
              <span className="underline-drawn">{profile.headlineRule}</span>
              {parts[1]}
            </>
          ) : (
            profile.headline
          )}
        </h1>

        <p className="mt-8 mb-10 max-w-2xl text-lg leading-relaxed font-light text-muted-foreground md:text-xl">
          {profile.intro}
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-4 font-mono text-sm">
          <a
            href="#work"
            className="group flex items-center gap-2 rounded-full border border-line-strong bg-wash px-5 py-3 transition-colors hover:bg-wash-strong"
          >
            <span>View Work</span>
            <ArrowRight
              size={14}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-1"
            />
          </a>
          <a
            href={profile.contact.github.url}
            target="_blank"
            rel="noreferrer"
            className="-my-2 flex items-center gap-2 py-3.5 text-foreground-dim transition-colors hover:text-foreground"
          >
            <Github size={15} aria-hidden="true" />
            GitHub
          </a>
          <a
            href={`mailto:${profile.contact.email}`}
            className="-my-2 flex items-center gap-2 py-3.5 text-foreground-dim transition-colors hover:text-foreground"
          >
            <Mail size={15} aria-hidden="true" />
            Email
          </a>
        </div>

        <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col bg-background px-5 py-4">
              <dt className="order-2 mt-1 font-mono text-[10px] leading-relaxed tracking-[0.14em] text-muted-foreground uppercase sm:text-[11px]">
                {stat.label}
              </dt>
              <dd className="order-1 font-mono text-2xl font-medium text-foreground tabular-nums">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
