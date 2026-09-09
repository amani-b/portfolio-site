import TransitionLink from "@/components/TransitionLink";

export const metadata = {
  title: "About — Alex Carter",
  description: "Who Alex Carter is as a developer, and how to get in touch.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6">
      <div className="grid grid-cols-1 gap-step-3 py-step-4 md:grid-cols-[14rem_1fr] md:py-step-5">
        <aside className="order-2 space-y-step-2 text-sm md:order-1 md:sticky md:top-8 md:self-start">
          <dl className="space-y-4">
            <div>
              <dt className="font-medium text-ink-soft">Studying</dt>
              <dd className="leading-relaxed">
                BSc Computer Science, final year
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ink-soft">Building with</dt>
              <dd>
                <ul className="mt-1 space-y-0.5 font-mono">
                  <li>TypeScript</li>
                  <li>React / Next.js</li>
                  <li>PostgreSQL</li>
                  <li>Docker</li>
                </ul>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ink-soft">Looking for</dt>
              <dd className="leading-relaxed">
                Backend or full-stack roles for after graduation
              </dd>
            </div>
          </dl>
        </aside>

        <div className="order-1 md:order-2">
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">About</h1>

          <div className="mt-step-3 max-w-2xl space-y-step-2 text-lg leading-relaxed">
            <p>
              I&rsquo;m a final-year computer science student who builds internal tools and data-driven web
              applications — the kind of software a team runs on rather than looks at. My{" "}
              <TransitionLink href="/projects/deploy-dashboard" className="font-medium text-ultramarine underline underline-offset-4 hover:no-underline">
                deploy dashboard
              </TransitionLink>{" "}
              aggregated continuous-integration events from eight services into one realtime health view and cut
              on-call triage time by roughly 80%; before it existed, that work happened by scrolling Slack threads.
            </p>
            <p>
              I care about the parts of a system that decide whether it survives contact with production: data models,
              type safety from the database to the interface, and honest trade-offs. I chose server-sent events over
              WebSockets because deploy events only flow one way; I chose tRPC because a hand-maintained API client was
              two weeks of the schedule I didn&rsquo;t want to spend. Each project&rsquo;s case study records those
              decisions, and what I&rsquo;d do differently next time.
            </p>
            <p>
              Outside of coursework I ship things end to end on my own — my{" "}
              <TransitionLink href="/projects/recipe-scanner" className="font-medium text-ultramarine underline underline-offset-4 hover:no-underline">
                recipe scanner
              </TransitionLink>{" "}
              runs on-device optical character recognition in a web worker so it works offline with zero API costs. I
              write the way I build: plainly, precisely, and with the mistakes left in where they&rsquo;re instructive.
            </p>
          </div>

          <section className="mt-step-5 border-t-2 border-line pt-step-5" id="contact">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Contact</h2>
            <p className="mt-step-2 max-w-2xl leading-relaxed text-ink-soft">
              The fastest way to reach me is email — I reply to everything. I&rsquo;m happy to talk about internships,
              junior roles, or anything I&rsquo;ve built.
            </p>
            <ul className="mt-step-2 space-y-2 text-lg">
              <li>
                <a
                  href="mailto:hello@example.com"
                  className="font-medium text-ultramarine underline underline-offset-4 hover:no-underline"
                >
                  hello@example.com
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/example-username"
                  className="font-medium text-ultramarine underline underline-offset-4 hover:no-underline"
                >
                  github.com/example-username
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com/in/example-username"
                  className="font-medium text-ultramarine underline underline-offset-4 hover:no-underline"
                >
                  linkedin.com/in/example-username
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
