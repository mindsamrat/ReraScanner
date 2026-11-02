import { Fragment } from "react";
import Link from "next/link";

/**
 * Tiny markdown renderer for the handful of guide pages; avoids pulling in a
 * full markdown dependency for content we control. Supports ## / ### headings,
 * paragraphs, "- " lists, "1. " lists, **bold**, `code` and [text](href).
 */
export function Markdown({ source }: { source: string }) {
  const blocks = source.trim().split(/\n{2,}/);
  return (
    <div className="prose-rs">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trimEnd());
        if (lines[0].startsWith("## ")) return <h2 key={i}>{inline(lines[0].slice(3))}</h2>;
        if (lines[0].startsWith("### ")) return <h3 key={i}>{inline(lines[0].slice(4))}</h3>;
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.slice(2))}</li>
              ))}
            </ul>
          );
        }
        if (lines.every((l) => /^\d+\.\s/.test(l))) {
          return (
            <ol key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\d+\.\s/, ""))}</li>
              ))}
            </ol>
          );
        }
        return <p key={i}>{inline(lines.join(" "))}</p>;
      })}
    </div>
  );
}

function inline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(<Fragment key={k++}>{text.slice(last, m.index)}</Fragment>);
    const tok = m[0];
    if (tok.startsWith("**")) parts.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) parts.push(<code key={k++}>{tok.slice(1, -1)}</code>);
    else {
      const mm = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/)!;
      const href = mm[2];
      parts.push(
        href.startsWith("/") ? (
          <Link key={k++} href={href}>{mm[1]}</Link>
        ) : (
          <a key={k++} href={href} target="_blank" rel="noopener noreferrer">{mm[1]}</a>
        ),
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(<Fragment key={k++}>{text.slice(last)}</Fragment>);
  return parts;
}
