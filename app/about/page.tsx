import TransitionLink from "@/components/TransitionLink";

export const metadata = {
  title: "About",
  description: "Who Amanuel Berhanu is as a developer, and how to get in touch.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 md:px-6">
      <div className="grid gap-10 py-step-4 md:grid-cols-[1fr_16rem] md:py-step-6 lg:gap-16">
        {/* Metadata rail — mirrors the case-study layout so the site reads as one system */}
        <aside className="order-2 space-y-8 border-b border-line pb-8 md:order-last md:border-b-0 md:pt-1">
          <dl className="space-y-6 text-sm">
            <div>
              <dt className="font-mono text-[11px] tracking-[0.18em] text-ink-soft uppercase">
                Studying
              </dt>
              <dd className="mt-1.5 leading-relaxed">BSc Computer Science, 3rd year</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] tracking-[0.18em] text-ink-soft uppercase">
                Building with
              </dt>
              <dd>
                <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[13px]">
                  <li>Java / Spring Boot</li>
                  <li>TypeScript</li>
                  <li>React / Next.js</li>
                  <li>PostgreSQL</li>
                </ul>
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] tracking-[0.18em] text-ink-soft uppercase">
                Looking for
              </dt>
              <dd className="mt-1.5 leading-relaxed">
                Backend or full-stack roles after graduation
              </dd>
            </div>
          </dl>
        </aside>

        <div className="order-1 min-w-0">
          <p className="font-mono text-[11px] tracking-[0.18em] text-ink-soft uppercase">About</p>
          <h1 className="balance-sm mt-4 font-display text-[2.3rem] leading-[1.05] font-semibold tracking-[-0.02em] sm:text-6xl">
            Plainly, precisely, with the mistakes left in.
          </h1>

          <div className="mt-8 max-w-2xl space-y-5 text-lg leading-relaxed">
            <p>
              I&rsquo;m a 3rd-year computer science student who builds the kind of software a team
              runs on rather than looks at. My{" "}
              <TransitionLink href="/projects/cafeerp" className="font-medium text-ink">
                <span className="rule-draw">biggest project so far</span>
              </TransitionLink>{" "}
              is a cafe management platform running in production: role-based orders and inventory,
              a versioned database schema, and an agentic AI assistant that performs real actions in
              English and Amharic — behind permissions, confirmation steps, and full audit logging.
            </p>
            <p>
              I care about the parts of a system that decide whether it survives contact with
              production: data models, type safety from the database to the interface, and honest
              trade-offs. I version every schema change with Flyway because I once spent a weekend
              untangling rows written in server-local time; I designed the assistant to stream
              &ldquo;what it&rsquo;s doing&rdquo; because autonomy without visibility isn&rsquo;t
              trust. Each project&rsquo;s case study records those decisions, and what I&rsquo;d do
              differently next time.
            </p>
            <p>
              I write the way I build: plainly, precisely, and with the mistakes left in where
              they&rsquo;re instructive.
            </p>
          </div>

          <section className="mt-step-5 border-t border-line pt-step-4" id="contact">
            <p className="font-mono text-[11px] tracking-[0.18em] text-ink-soft uppercase">
              Contact
            </p>
            <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">
              The fastest way to reach me is email — I reply to everything. Happy to talk about
              internships, junior roles, or anything I&rsquo;ve built.
            </p>
            <ul className="mt-6 space-y-3 text-lg font-medium">
              <li>
                <a
                  href="mailto:amanuelberhanu.2052@gmail.com"
                  className="press -my-2 inline-block py-2 text-ink"
                >
                  <span className="rule-draw">amanuelberhanu.2052@gmail.com</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/amani-b"
                  className="press -my-2 inline-block py-2 text-ink"
                >
                  <span className="rule-draw">github.com/amani-b</span>
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
