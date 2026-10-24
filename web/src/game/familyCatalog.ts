// The family as `genkg export-web` writes it: catalog.json, people/<id>.json
// and species.json. Loaded at runtime, never compiled in -- a GEDCOM is
// personal data about living people, and this repo publishes nothing built
// from one. See genealogy_kg/docs/USAGE.md, "Exports for The Knowledge Press:
// The Family".

/** The export format this build reads. genealogy_kg bumps it on a breaking change. */
export const FAMILY_FORMAT = 1;

/** The line no surname or parent places anyone in; no tree grows for it. */
export const UNKNOWN_LINE = "unknown";

export type FamilyPerson = {
  id: string;
  name: string;
  surname: string | null;
  sex: string | null;
  born: string | null;
  died: string | null;
  birth_place: string | null;
  line: string;
  /** Redacted: named "Living", with no dates, places or record. */
  living: boolean;
};

export type FamilyUnit = { id: string; spouses: string[]; children: string[]; married: string | null };

export type FamilyLine = {
  id: string;
  surname: string;
  grove: string;
  /** The founder first, then the founder's spouses. */
  founders: string[];
  /** Everyone born into the line, founder first. */
  members: string[];
  span: [string, string] | null;
};

/** A marriage between two lines: a road between their trees. */
export type FamilyLink = { family: string; lines: string[]; spouses: string[]; married: string | null };

export type FamilyPlace = { id: string; name: string; within: string | null; events: number };

export type FamilyCatalog = {
  meta: {
    format: number;
    generator: string;
    generated: string;
    sources: string[];
    privacy: { living_cutoff_years: number | null; unknown_birth_policy: string; include_living: boolean };
    counts: Record<string, number>;
  };
  lines: FamilyLine[];
  people: FamilyPerson[];
  families: FamilyUnit[];
  links: FamilyLink[];
  places: FamilyPlace[];
};

export type FamilyEvent = { type: string | null; label: string; date: string | null; place: string | null };

/** people/<id>.json: the record reader's page. */
export type PersonPage = {
  id: string;
  name: string;
  sex: string | null;
  line: string;
  living: boolean;
  summary: string | null;
  events: FamilyEvent[];
  parents: string[];
  spouses: { id: string; family: string }[];
  children: string[];
  record: { file: string; start: number; end: number; lines: string[] } | null;
};

/** The catalog's kinship, indexed for walking. */
export type FamilyIndex = {
  catalog: FamilyCatalog;
  person: Map<string, FamilyPerson>;
  family: Map<string, FamilyUnit>;
  line: Map<string, FamilyLine>;
  /** Person -> families they are a spouse in, earliest marriage first. */
  familiesOf: Map<string, string[]>;
  /** Person -> families they are a child in. */
  birthFamilies: Map<string, string[]>;
};

const byYear = (a: string | null, b: string | null) => (a ?? "9999").localeCompare(b ?? "9999");

/**
 * Index a catalog for the tree walks.
 *
 * :param catalog: As loaded.
 * :returns: Lookups by id and the family edges both ways.
 */
export function indexCatalog(catalog: FamilyCatalog): FamilyIndex {
  const person = new Map(catalog.people.map((p) => [p.id, p]));
  const family = new Map(catalog.families.map((f) => [f.id, f]));
  const line = new Map(catalog.lines.map((l) => [l.id, l]));
  const familiesOf = new Map<string, string[]>();
  const birthFamilies = new Map<string, string[]>();
  const push = (m: Map<string, string[]>, k: string, v: string) => {
    const list = m.get(k);
    if (list) list.push(v);
    else m.set(k, [v]);
  };
  for (const f of catalog.families) {
    for (const s of f.spouses) push(familiesOf, s, f.id);
    for (const c of f.children) push(birthFamilies, c, f.id);
  }
  for (const list of familiesOf.values()) {
    list.sort((a, b) => byYear(family.get(a)!.married, family.get(b)!.married) || a.localeCompare(b));
  }
  return { catalog, person, family, line, familiesOf, birthFamilies };
}

/** A person's parents: the spouses of every family they were born into. */
export function parentsOf(index: FamilyIndex, id: string): string[] {
  const out: string[] = [];
  for (const f of index.birthFamilies.get(id) ?? []) {
    for (const s of index.family.get(f)!.spouses) if (!out.includes(s)) out.push(s);
  }
  return out;
}

/** A family's children, eldest first, undated last. */
export function childrenOf(index: FamilyIndex, familyId: string): string[] {
  return [...index.family.get(familyId)!.children].sort(
    (a, b) => byYear(index.person.get(a)?.born ?? null, index.person.get(b)?.born ?? null) || a.localeCompare(b),
  );
}

/**
 * The focal person the app opens on, since the export names none: the founder
 * of the line with the most members.
 */
export function defaultFocal(catalog: FamilyCatalog): string {
  const lines = catalog.lines.filter((l) => l.id !== UNKNOWN_LINE && l.members.length);
  if (!lines.length) return catalog.people[0]?.id ?? "";
  const biggest = lines.reduce((a, b) => (b.members.length > a.members.length ? b : a));
  return biggest.members[0]!;
}

/**
 * Fetch a family exported by `genkg export-web`.
 *
 * :param base: The directory URL holding catalog.json, with a trailing slash.
 * :throws: On a missing file or an export format this build does not read.
 */
const ROMAN = /^(?=[MDCLXVI])M*(C[MD]|D?C{0,3})(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})$/;

/**
 * A name as people write it: a word in capitals, the old GEDCOM way of
 * marking a surname ("John Fitzgerald KENNEDY", "WASHINGTON"), in title case.
 * Roman numerals ("Henry VIII") and single letters are left alone.
 */
export function tidyName(name: string): string {
  return name.replace(/[A-Z][A-Z'-]+/g, (w) => {
    if (ROMAN.test(w)) return w;
    // "O'BRIEN-SMITH" -> "O'Brien-Smith": capitals after an apostrophe or hyphen stay.
    return w[0] + w.slice(1).toLowerCase().replace(/([-'])([a-z])/g, (_, p: string, c: string) => p + c.toUpperCase());
  });
}

export async function loadFamilyCatalog(base: string): Promise<FamilyCatalog> {
  const res = await fetch(`${base}catalog.json`);
  if (!res.ok) throw new Error(`no family at ${base}catalog.json (${res.status}); run make family`);
  const catalog = (await res.json()) as FamilyCatalog;
  if (catalog.meta?.format !== FAMILY_FORMAT) {
    throw new Error(`catalog.json is export format ${catalog.meta?.format}; this build reads ${FAMILY_FORMAT}`);
  }
  for (const p of catalog.people) {
    p.name = tidyName(p.name);
    if (p.surname) p.surname = tidyName(p.surname);
  }
  for (const l of catalog.lines) l.surname = tidyName(l.surname);
  return catalog;
}

/** Fetch one person's page for the record reader. */
export async function loadPersonPage(base: string, id: string): Promise<PersonPage> {
  const res = await fetch(`${base}people/${encodeURIComponent(id)}.json`);
  if (!res.ok) throw new Error(`no page for ${id} (${res.status})`);
  const page = (await res.json()) as PersonPage;
  page.name = tidyName(page.name);
  return page;
}

/** One family the app can show: a folder under public/families (scripts/families.mjs). */
export type FamilyEntry = {
  slug: string;
  title: string;
  people: number;
  lines: number;
  /** The person its home tree opens on (`make family FAMILY_FOCAL=`), if one was named. */
  focal?: string;
};

/**
 * Fetch the list of exported families.
 *
 * :param root: The app's base URL, with a trailing slash.
 * :returns: The families, or null when there is no index (an export from
 *     before families, in public/family/ alone).
 */
export async function loadFamilyIndex(root: string): Promise<FamilyEntry[] | null> {
  const res = await fetch(`${root}families/index.json`);
  if (!res.ok) return null;
  const index = (await res.json()) as { families?: FamilyEntry[] };
  return Array.isArray(index.families) && index.families.length ? index.families : null;
}

/** The family to show: the one asked for in the URL, else the last one chosen, else the first. */
export function chooseFamily(families: readonly FamilyEntry[], asked: string | null, saved: string | null): FamilyEntry {
  return families.find((f) => f.slug === asked) ?? families.find((f) => f.slug === saved) ?? families[0]!;
}
