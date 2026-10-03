import { Github, Mail } from 'lucide-react';
import { profile } from '../data/profile';
import CopyEmailButton from './CopyEmailButton';
import Reveal from './Reveal';

/**
 * About and contact, in the section's original two-column composition.
 *
 * The prose is the old About page verbatim. Two things were dropped rather than
 * reworded: the LinkedIn link (the old site removed it deliberately) and the
 * Résumé link, which pointed at a `/resume.pdf` that was never published.
 */
export default function About({ id }: { id: string }) {
  const { contact, about } = profile;

  /*
   * The old site linked the phrase "biggest project so far" to the case-study
   * route. Splitting the verbatim paragraph around that phrase keeps the copy
   * untouched and gives the link a home on this single-page version.
   */
  const lead = about.paragraphs[0].split(about.projectLinkText);
  const hasLink = lead.length === 2;

  return (
    <section id={id} className="border-t border-line py-24 md:py-32">
      <div className="grid gap-12 md:grid-cols-[1fr_2fr] md:gap-24">
        <div>
          <h2 className="sticky top-32 font-mono text-sm tracking-widest text-muted-foreground uppercase">
            About &amp; Contact
          </h2>
        </div>

        <div>
          <Reveal>
            <h3 className="max-w-2xl text-3xl font-medium tracking-tight text-foreground md:text-4xl">
              {about.heading}
            </h3>

            <div className="mt-8 max-w-2xl space-y-6 text-lg leading-relaxed font-light text-muted-foreground">
              <p>
                {hasLink ? (
                  <>
                    {lead[0]}
                    <a
                      href="#work"
                      className="font-medium text-foreground"
                    >
                      <span className="link-underline">{about.projectLinkText}</span>
                    </a>
                    {lead[1]}
                  </>
                ) : (
                  about.paragraphs[0]
                )}
              </p>
              <p>{about.paragraphs[1]}</p>
              <p>{about.paragraphs[2]}</p>
            </div>
          </Reveal>

          <Reveal delay={200} className="mt-16 border-t border-line pt-8">
            <h4 className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
              Contact
            </h4>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
              {profile.contactBlurb}
            </p>

            <ul className="mt-6 flex flex-col gap-4">
              <li className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-3 py-3 font-mono text-sm text-foreground transition-colors hover:text-accent"
                >
                  <Mail size={16} aria-hidden="true" className="shrink-0 text-foreground-dim" />
                  {contact.email}
                </a>
                <CopyEmailButton email={contact.email} />
              </li>
              <li>
                <a
                  href={contact.github.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 py-3 font-mono text-sm text-foreground transition-colors hover:text-accent"
                >
                  <Github size={16} aria-hidden="true" className="shrink-0 text-foreground-dim" />
                  {contact.github.label}
                </a>
              </li>
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
