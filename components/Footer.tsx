export default function Footer() {
  return (
    <footer className="border-t-2 border-line">
      <div className="mx-auto flex w-full max-w-6xl gap-6 px-6 py-6 text-sm text-ink-soft">
        <a href="mailto:hello@example.com" className="hover:text-ultramarine hover:underline hover:underline-offset-4">
          hello@example.com
        </a>
        <a
          href="https://github.com/example-username"
          className="hover:text-ultramarine hover:underline hover:underline-offset-4"
        >
          github.com/example-username
        </a>
      </div>
    </footer>
  );
}

