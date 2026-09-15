import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://amani-b.github.io"),
  title: {
    default: "Amanuel Berhanu — Portfolio",
    template: "%s — Amanuel Berhanu",
  },
  description:
    "Portfolio of Amanuel Berhanu, a 3rd-year computer science student who builds software products end to end.",
  openGraph: {
    type: "website",
    siteName: "Amanuel Berhanu — Portfolio",
    title: "Amanuel Berhanu — Portfolio",
    description:
      "I build software-related products, from data models to interfaces. Case studies with honest write-ups of decisions and trade-offs.",
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amanuel Berhanu — Portfolio",
    description: "I build software-related products, from data models to interfaces.",
  },
  robots: { index: true, follow: true },
};

/**
 * `viewportFit: "cover"` is what makes `env(safe-area-inset-*)` resolve on iOS —
 * the bottom tab bar and the body's reserved padding depend on it.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5f0" },
    { media: "(prefers-color-scheme: dark)", color: "#14130f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bricolage.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        {/* Marks JS availability before first paint so .reveal start states only apply when they can animate away.
            The empty touchstart listener is the standard iOS switch that lets :active fire on tap targets. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('js');document.addEventListener('touchstart',function(){},{passive:true});",
          }}
        />
        {/* Applies the stored (or system) theme before first paint — no flash of the wrong theme. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;var c=document.documentElement.classList;d?c.add('dark'):c.add('light');}catch(e){}})()",
          }}
        />
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
