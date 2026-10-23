import type { LineCard } from "./familyForest";

/**
 * What the guided tour says at each grove: a short summary generated from the
 * catalog, so a new book changes it with nothing written by hand. It names the
 * grove, how many books it holds and by whom, its longest book, and for
 * diaries the years their entries span.
 */

/** Catalog authors whose Project Gutenberg form reads badly aloud. */
const SPOKEN_NAMES: Record<string, string> = {
  "Leo, graf Tolstoy": "Leo Tolstoy",
  "of Hippo, Saint Augustine": "Saint Augustine of Hippo",
  "Adam, Captain Seaborn": "Captain Adam Seaborn",
  "Emperor of Rome Marcus Aurelius": "Marcus Aurelius",
  "da Pisa Rusticiano": "Rustichello da Pisa",
  "the Younger Pliny": "Pliny the Younger",
};

/**
 * An author's name as it should be spoken: expansions in parentheses dropped
 * ("H. P. (Howard Phillips) Lovecraft" -> "H. P. Lovecraft") and a title after
 * the name dropped ("George Gordon Byron, Baron Byron" -> "George Gordon Byron").
 * Null for an unknown author.
 */
export function spokenAuthor(author: string): string | null {
  if (!author || author === "Unknown" || author === "Anonymous" || author === "Various") return null;
  if (SPOKEN_NAMES[author]) return SPOKEN_NAMES[author]!;
  const plain = author.replace(/\s*\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  const [head] = plain.split(",");
  return head!.includes(" ") ? head!.trim() : plain;
}

/** True when `text` names the author: a word of three letters or more in common. */
function namesAuthor(text: string, author: string): boolean {
  const words = (x: string) => x.toLowerCase().split(/[^\p{L}]+/u).filter((w) => w.length >= 3);
  const own = new Set(words(author));
  return words(text).some((w) => own.has(w));
}

/**
 * A title as it should be spoken, without the catalog's disambiguators: a
 * trailing author ("Confessions — Saint Augustine", "Bleak House (Dickens)")
 * or "— Complete" goes, a volume or a translation stays ("The Portrait of a
 * Lady, Volume 1", "The Divine Comedy (Cary's Translation)").
 */
export function spokenTitle(title: string, author: string): string {
  let t = title.trim().replace(/\.$/, "");
  const paren = t.match(/^(.*\S)\s*\(([^)]*)\)$/);
  if (paren && namesAuthor(paren[2]!, author)) t = paren[1]!;
  const [head, ...rest] = t.split(" — ");
  if (!rest.length) return t;
  const tail = rest.join(" — ").replace(/\s*\([^)]*\)$/, "");
  return tail === "Complete" || namesAuthor(tail, author) ? head! : `${head}, ${tail}`;
}

/** "A", "A and B", "A, B and C". */
function list(items: string[]): string {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * The grove's summary, a few sentences to show and to speak: how many lines
 * bear the surname, how many people were born into them, the years they span,
 * and who founded the largest.
 *
 * :param label: The surname.
 * :param lines: The grove's lines.
 */
export function groveNarration(label: string, lines: LineCard[]): string {
  if (!lines.length) return `${label}.`;
  const people = lines.reduce((n, l) => n + l.members, 0);
  const largest = [...lines].sort((a, b) => b.members - a.members || a.slug.localeCompare(b.slug))[0]!;
  const years = lines.flatMap((l) => (l.span ? l.span.split("-").map(Number) : [])).filter((y) => Number.isInteger(y) && y > 0);
  const out: string[] = [];
  const born = people === 1 ? "one person" : `${people} people`;
  out.push(lines.length === 1
    ? `${label}: ${born} born a ${label}.`
    : `${label}: ${lines.length} lines, ${born} born a ${label}.`);
  if (years.length) {
    const lo = Math.min(...years), hi = Math.max(...years);
    out.push(lo === hi ? `Born in ${lo}.` : `Born from ${lo} to ${hi}.`);
  }
  out.push(`${lines.length === 1 ? "The line" : "The largest line"} begins with ${largest.founders}.`);
  return out.join(" ");
}
