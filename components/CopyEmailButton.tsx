"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Copy-to-clipboard pill for the email address (Footer + About contact).
 *
 * Notebook language, one device per job:
 * - Resting: a hairline circle — icon only, `border-line` on raised paper,
 *   linework at the same 1.25 stroke as the theme glyphs.
 * - Hover / keyboard focus: the pill opens horizontally — a CSS grid
 *   `0fr → 1fr` transition, so the width eases to exactly the label's
 *   natural size with the site's signature easing. On a finger, which has
 *   no hover, the tap itself is the interaction.
 * - Success: the ONE accent device. Border and label go International
 *   Orange, and the tick draws itself the way the site's rules draw
 *   (`.tick-draw`, stroke-dashoffset). It holds for two seconds, then the
 *   pill folds back to its resting shape.
 *
 * `role="status"` carries the confirmation to screen readers regardless of
 * what the visual state does. `navigator.clipboard` covers secure origins;
 * the textarea fallback keeps `file://` and other non-secure contexts honest.
 */

const RESET_MS = 2000;

async function writeClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission denied / locked-down WebView — try the legacy path below.
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

/* Hairline linework, same weight as the theme-switch glyphs. */

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="5.75" y="5.75" width="8.5" height="8.5" rx="1.25" />
      <path d="M10.25 3.25h-6a1 1 0 0 0-1 1v6" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* pathLength=1 lets .tick-draw animate the dash without knowing the length */}
      <path pathLength={1} d="M3.25 8.75l3.25 3.25 6.25-7.5" />
    </svg>
  );
}

export default function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const [copyCount, setCopyCount] = useState(0); // re-keys the tick so each copy redraws it
  const resetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  async function handleCopy() {
    const ok = await writeClipboard(email);
    if (!ok) return;
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    setCopied(true);
    setCopyCount((n) => n + 1);
    resetTimer.current = window.setTimeout(() => setCopied(false), RESET_MS);
  }

  return (
    <span className="inline-flex">
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy email address to clipboard"
        className={`press group inline-flex h-11 shrink-0 cursor-pointer items-center rounded-full border bg-paper-raised pr-2.5 pl-3 transition-colors duration-200 ${
          copied
            ? "border-accent bg-accent-wash text-accent"
            : "border-line text-ink-soft hover:border-line-strong hover:text-ink"
        }`}
      >
        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
          {copied ? (
            <CheckIcon key={copyCount} className="tick-draw h-4 w-4" />
          ) : (
            <CopyIcon className="h-4 w-4" />
          )}
        </span>
        {/*
          The label is a `0fr` grid track that opens to `1fr`: the pill grows
          to exactly the text and nothing more. Hidden when collapsed only
          visually — it stays in the DOM for the transition and the repaint.
        */}
        <span
          aria-hidden="true"
          className={`grid overflow-hidden transition-[grid-template-columns] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.2,0.9,0.3,1)] ${
            copied
              ? "grid-cols-[1fr]"
              : "grid-cols-[0fr] group-hover:grid-cols-[1fr] group-focus-visible:grid-cols-[1fr]"
          }`}
        >
          <span className="min-w-0 overflow-hidden pl-1.5 font-mono text-[11px] font-medium tracking-[0.18em] whitespace-nowrap uppercase">
            {copied ? "Copied" : "Copy"}
          </span>
        </span>
      </button>
      <span role="status" className="sr-only">
        {copied ? "Email address copied to clipboard" : ""}
      </span>
    </span>
  );
}
