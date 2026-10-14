import { Compass, GraduationCap, Wrench } from 'lucide-react';
import { profile } from '../data/profile';
import Reveal from './Reveal';

/**
 * Replaces the previous "Experience" section.
 *
 * The old portfolio records no employment history — the three roles that used
 * to be listed here (Tech Corp, University CS Dept, "Various") were invented and
 * have been removed rather than reworded. What the old project *does* record is
 * the metadata rail from its About page: what he's studying, what he builds
 * with, and what he's looking for. That is what this section carries, as
 * three cards with a ghost numeral in the section label.
 */
const ICONS = [GraduationCap, Wrench, Compass];

export default function Background({ id }: { id: string }) {
  const { education } = profile;

  const rows = [
    {
      label: 'Studying',
      value: <p className="text-lg leading-relaxed text-foreground">{education.studying}</p>,
    },
    {
      label: 'Building with',
      value: (
        <ul className="flex flex-wrap gap-2 font-mono text-xs text-foreground-dim">
          {education.buildingWith.map((item) => (
            <li
              key={item}
              className="rounded-full border border-line bg-wash px-3 py-1.5 transition-colors hover:border-line-strong hover:text-foreground"
            >
              {item}
            </li>
          ))}
        </ul>
      ),
    },
    {
      label: 'Looking for',
      value: (
        <p className="text-lg leading-relaxed text-foreground">
          {education.lookingFor}
          <span aria-hidden="true" className="ml-2 inline-block h-2 w-2 rounded-full bg-accent" />
        </p>
      ),
    },
  ];

  return (
    <section id={id} className="border-t border-line py-24 md:py-32">
      <div className="grid gap-12 md:grid-cols-[1fr_2fr] md:gap-24">
        <div>
          <h2 className="font-mono text-sm tracking-[0.18em] text-muted-foreground uppercase md:sticky md:top-32">
            <span aria-hidden="true" className="ghost-numeral mr-3 text-2xl font-medium">
              01
            </span>
            Background
          </h2>
        </div>

        <div className="flex flex-col">
          {rows.map((row, index) => {
            const Icon = ICONS[index % ICONS.length];
            return (
              <Reveal
                key={row.label}
                delay={index * 80}
                className={index === 0 ? '' : 'border-t border-line'}
              >
                <div
                  className={`group grid gap-3 sm:grid-cols-[10rem_1fr] sm:gap-6 ${
                    index === 0 ? 'pb-8' : 'py-8'
                  }`}
                >
                  <h3 className="flex items-center gap-2 font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
                    <Icon
                      size={14}
                      aria-hidden="true"
                      className="text-foreground-dim transition-colors group-hover:text-accent"
                    />
                    {row.label}
                  </h3>
                  <div>{row.value}</div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
