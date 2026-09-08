import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b-2 border-line">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-baseline justify-between px-6">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          Alex Carter
        </Link>
        <nav className="flex gap-6 text-sm">
          <Link href="/" className="hover:text-ultramarine hover:underline hover:underline-offset-4">
            Home
          </Link>
          <Link href="/projects" className="hover:text-ultramarine hover:underline hover:underline-offset-4">
            Projects
          </Link>
          <Link href="/about" className="hover:text-ultramarine hover:underline hover:underline-offset-4">
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}

