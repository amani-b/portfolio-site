import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Copy-to-clipboard control for the email address.
 *
 * The old portfolio had one and the address is the site's only contact route,
 * so dropping it would have been a functional regression. The markup is this
 * app's own: a pill matching the bottom nav's material, with the accent doing
 * the one job it has — confirming the copy.
 *
 * `navigator.clipboard` covers secure origins; the textarea fallback keeps
 * non-secure contexts (plain http, file://) honest. `role="status"` carries the
 * confirmation to screen readers regardless of what the visual state does.
 */

const RESET_MS = 2000;

async function writeClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission denied / locked-down webview — fall through to the legacy path.
    }
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export default function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  async function handleCopy() {
    const ok = await writeClipboard(email);
    if (!ok) return;
    if (timer.current !== null) window.clearTimeout(timer.current);
    setCopied(true);
    timer.current = window.setTimeout(() => setCopied(false), RESET_MS);
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy email address to clipboard"
        className={`inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 font-mono text-xs tracking-[0.18em] uppercase transition-colors ${
          copied
            ? "border-accent text-accent"
            : "border-line text-foreground-dim hover:border-line-strong hover:text-foreground"
        }`}
      >
        {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
        {copied ? "Copied" : "Copy"}
      </button>
      <span role="status" className="sr-only">
        {copied ? "Email address copied to clipboard" : ""}
      </span>
    </span>
  );
}
