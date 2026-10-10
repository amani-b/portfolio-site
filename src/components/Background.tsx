import { profile } from '../data/profile';
import Reveal from './Reveal';

/**
 * Replaces the previous "Experience" section.
 *
 * The old portfolio records no employment history — the three roles that used
 * to be listed here (Tech Corp, University CS Dept, "Various") were invented and
 * have been removed rather than reworded. What the old project *does* record is
 * the metadata rail from its About page: what he's studying, what he builds
 * with, and what he's looking for. That is what this section carries, in the
 * same two-column composition the section always had.
 */
export default function Background({ id }: { id: string }) {
  const { education } = profile;

  const rows = [
    { label: 'Studying', value: <p className="text-lg leading-relaxed">{education.studying}</p> },
    {
      label: 'Building with',
      value: (
        <ul className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm text-foreground-dim">
          {education.buildingWith.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ),
    },
    {
      label: 'Looking for',
      value: <p className="text-lg leading-relaxed">{education.lookingFor}</p>,
    },
  ];

  return (
    <section id={id} className="border-t border-line py-24 md:py-32">
      <div className="grid gap-12 md:grid-cols-[1fr_2fr] md:gap-24">
        <div>
          <h2 className="sticky top-32 font-mono text-sm tracking-[0.18em] text-muted-foreground uppercase">
            Background
          </h2>
        </div>

        <div className="flex flex-col">
          {rows.map((row, index) => (
            <Reveal
              key={row.label}
              className={index === 0 ? '' : 'border-t border-line'}
            >
              <div
                className={`grid gap-3 sm:grid-cols-[10rem_1fr] sm:gap-6 ${
                  index === 0 ? 'pb-8' : 'py-8'
                }`}
              >
                <h3 className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
                  {row.label}
                </h3>
                <div className="text-foreground">{row.value}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
