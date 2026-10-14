import { Github, Mail } from 'lucide-react';
import { profile } from '../data/profile';
import { getAllProjects } from '../data/projects';
import { Link } from '../lib/router';
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
   * untouched; the link lands on the newest project's detail document, which
   * is where the full case study lives. No slug is written here, so the link
   * can never point at a project that no longer exists.
   */
  const lead = about.paragraphs[0].split(about.projectLinkText);
  const hasLink = lead.length === 2;
  const newest = getAllProjects()[0];
  const projectHref = newest ? `/projects/${newest.slug}` : '/#work';

  return (
    <section id={id} className="border-t border-line py-24 md:py-32">
      <div className="grid gap-12 md:grid-cols-[1fr_2fr] md:gap-24">
        <div>
          <h2 className="font-mono text-sm tracking-[0.18em] text-muted-foreground uppercase md:sticky md:top-32">
            <span aria-hidden="true" className="ghost-numeral mr-3 text-2xl font-medium">
              03
            </span>
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
                    <Link
                      to={projectHref}
                      className="font-medium text-foreground"
                    >
                      <span className="link-underline">{about.projectLinkText}</span>
                    </Link>
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

          {/*
            Principles, distilled from the decisions the case study actually
            records (versioned schema, UTC contract, confirmation policy,
            opt-in inventory) — a summary of demonstrated practice, not new
            claims. Each `lead` names the habit; each `text` the receipt.
          */}
          <Reveal className="mt-16 border-t border-line pt-8">
            <h4 className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
              How I work
            </h4>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { lead: 'Version everything', text: 'Flyway migrations, never silent drift.' },
                { lead: 'UTC in, local out', text: 'One timezone contract, one display service.' },
                { lead: 'Autonomy with guards', text: 'AI acts only behind confirm + audit log.' },
                { lead: 'Opt-in complexity', text: 'Features that stay out of the way until asked.' },
              ].map((item) => (
                <li
                  key={item.lead}
                  className="rounded-xl border border-line bg-wash px-4 py-3.5 transition-colors hover:border-line-strong"
                >
                  <p className="font-medium text-foreground">{item.lead}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="mt-16 border-t border-line pt-8">
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
