import { ArrowRight, Github, Mail } from 'lucide-react';
import { profile } from '../data/profile';

/**
 * The opening statement. Composition is unchanged from the redesign; the content
 * is now the real one, and the arrival animation is the `.rise` keyframe in
 * index.css.
 *
 * The eyebrow carries the name because the desktop nav is `md:`-only — on a
 * phone this is the first and only place the page says whose portfolio it is.
 */
export default function Hero({ id }: { id: string }) {
  /*
   * The headline lives in the data file, and the phrase that carries the drawn
   * rule is marked there. Splitting on it here is what keeps the copy in one
   * place: the previous version hard-coded "I build systems that … with
   * production." in this component while `profile.headline` sat unread, so
   * editing the data silently changed nothing.
   */
  const parts = profile.headline.split(profile.headlineRule);
  const hasRule = parts.length === 2;

  return (
    <section id={id} className="flex min-h-[85vh] flex-col justify-center pt-16 md:pt-20">
      <div className="rise max-w-3xl">
        <p className="mb-6 font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          {profile.eyebrow}
        </p>

        <h1 className="text-4xl leading-[1.1] font-medium tracking-tight text-foreground md:text-6xl lg:text-7xl">
          {hasRule ? (
            <>
              {parts[0]}
              <span className="underline decoration-accent decoration-2 underline-offset-[6px]">
                {profile.headlineRule}
              </span>
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
            href="#projects"
            className="group flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 transition-all hover:bg-white/10"
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
            className="-my-2 flex items-center gap-2 py-3 text-foreground-dim transition-colors hover:text-foreground"
          >
            <Github size={15} aria-hidden="true" />
            GitHub
          </a>
          <a
            href={`mailto:${profile.contact.email}`}
            className="-my-2 flex items-center gap-2 py-3 text-foreground-dim transition-colors hover:text-foreground"
          >
            <Mail size={15} aria-hidden="true" />
            Email
          </a>
        </div>
      </div>
    </section>
  );
}
