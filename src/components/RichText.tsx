import type { ReactNode } from "react";

/**
 * Renders the small inline subset of markdown the case-study source uses:
 * `**bold**`, `*em*` and `` `code` ``.
 *
 * Returns React nodes rather than an HTML string, so the prose is inert by
 * construction — no `dangerouslySetInnerHTML`, no sanitiser, nothing to get
 * wrong when the content file changes.
 */
const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;

export default function RichText({ text }: { text: string }): ReactNode {
  return (
    <>
      {text.split(INLINE).map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return (
            <strong key={index} className="font-medium text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return (
            <code
              key={index}
              className="rounded bg-wash px-1 py-0.5 font-mono text-[0.85em] text-foreground"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return <em key={index}>{part.slice(1, -1)}</em>;
        }
        return part;
      })}
    </>
  );
}
