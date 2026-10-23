import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { loadFamilyCatalog, loadPersonPage, type FamilyCatalog, type PersonPage } from "./familyCatalog";
import type { LineCard } from "./familyForest";
import { useGame } from "./store";

/** Where `make family` puts the export; never committed. */
export const FAMILY_BASE = `${import.meta.env.BASE_URL}family/`;

/** The person each line was left at, for this session. */
const lastPerson = new Map<string, string>();
/** A relative clicked on another line: who that line opens on. */
let pendingPerson: string | null = null;

/** The catalog, fetched once, for naming relatives the page gives as ids. */
let catalog: Promise<FamilyCatalog> | null = null;
const familyCatalog = () => (catalog ??= loadFamilyCatalog(FAMILY_BASE));

type Load<T> = { state: "loading" } | { state: "error"; message: string } | { state: "ready"; value: T };

/**
 * The record reader: a line's people, one page each, from people/<id>.json --
 * the summary, events, relatives and the GEDCOM record lines. A relative is a
 * link: on this line it turns the page, on another it opens that line.
 */
export function FamilyReader({ line }: { line: LineCard }) {
  const close = () => useGame.getState().openReader(null);
  const roster = line.roster;
  const startAt = () => {
    const wanted = pendingPerson ?? lastPerson.get(line.slug);
    pendingPerson = null;
    return Math.max(0, roster.findIndex((r) => r.id === wanted));
  };
  const [index, setIndex] = useState(startAt);
  const [page, setPage] = useState<Load<PersonPage>>({ state: "loading" });
  const [names, setNames] = useState<Map<string, { name: string; line: string }>>(new Map());
  const [attempt, setAttempt] = useState(0);
  const pane = useRef<HTMLDivElement>(null);
  const current = roster[Math.min(index, roster.length - 1)];

  useEffect(() => {
    let live = true;
    familyCatalog().then((c) => {
      if (live) setNames(new Map(c.people.map((p) => [p.id, { name: p.name, line: p.line }])));
    }, () => {});
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (!current) return;
    let live = true;
    setPage({ state: "loading" });
    loadPersonPage(FAMILY_BASE, current.id).then(
      (value) => { if (live) setPage({ state: "ready", value }); },
      (e: unknown) => { if (live) setPage({ state: "error", message: String((e as Error).message ?? e) }); },
    );
    lastPerson.set(line.slug, current.id);
    pane.current?.scrollTo({ top: 0 });
    return () => { live = false; };
  }, [line.slug, current, attempt]);

  // Left and Right turn to the previous or next person; Up and Down scroll.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select")) return;
      if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
        if (e.repeat) return;
        const next = index + (e.code === "ArrowLeft" ? -1 : 1);
        if (next >= 0 && next < roster.length) setIndex(next);
        e.preventDefault();
      } else if (e.code === "ArrowUp" || e.code === "ArrowDown") {
        const p = pane.current;
        if (p) p.scrollBy({ top: (e.code === "ArrowUp" ? -1 : 1) * p.clientHeight * 0.4, behavior: "smooth" });
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, roster.length]);

  /** Turn to a relative: on this line, their page; on another, that line. */
  const visit = (id: string) => {
    const here = roster.findIndex((r) => r.id === id);
    if (here >= 0) { setIndex(here); return; }
    const other = names.get(id)?.line;
    if (other) { pendingPerson = id; useGame.getState().openReader(other); }
  };
  const relative = (id: string, note?: string) => (
    <li key={id + (note ?? "")}>
      <button type="button" onClick={() => visit(id)} className="text-left text-primary underline-offset-2 hover:underline">
        {names.get(id)?.name ?? id}
      </button>
      {note ? <span className="text-muted"> {note}</span> : null}
    </li>
  );

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-bg/60 p-2 sm:p-6" onClick={close}>
      <article role="dialog" aria-modal="true" aria-labelledby="reader-title"
        className="flex h-[92dvh] w-full max-w-3xl flex-col rounded-xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <header className="flex items-start gap-3 border-b border-border p-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="text-xs tracking-wide text-muted uppercase">{line.title}{line.span ? ` · ${line.span}` : ""}</p>
            <h2 id="reader-title" className="font-display text-2xl leading-tight sm:text-3xl">{current?.name ?? line.title}</h2>
            {current?.years ? <p className="text-sm text-muted">{current.years}</p> : null}
          </div>
          <button type="button" autoFocus onClick={close}
            className="grid size-11 shrink-0 place-items-center rounded-md text-muted" aria-label="Close the record">
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </header>

        {roster.length > 1 ? (
          <label className="flex items-center gap-3 border-b border-border px-4 py-2 text-sm text-muted sm:px-6">
            Person
            <select value={Math.min(index, roster.length - 1)} onChange={(e) => setIndex(Number(e.target.value))}
              className="min-w-0 flex-1 truncate rounded-md border border-border bg-bg p-2 text-fg">
              {roster.map((r, i) => <option key={r.id} value={i}>{r.name}{r.years ? ` (${r.years})` : ""}</option>)}
            </select>
          </label>
        ) : null}

        <div ref={pane} className="min-h-0 flex-1 overflow-auto px-5 py-5 sm:px-10">
          {page.state === "error" ? (
            <div className="grid gap-3 text-sm leading-relaxed text-muted">
              <p className="text-fg">The record could not be fetched: {page.message}.</p>
              <p>The orchard reads each person from <code className="text-fg">family/people/&lt;id&gt;.json</code>; run <code className="text-fg">make family</code>.</p>
              <button type="button" onClick={() => setAttempt((n) => n + 1)}
                className="min-h-11 justify-self-start rounded-md bg-primary px-4 text-primary-fg">Try again</button>
            </div>
          ) : page.state === "loading" ? (
            <p className="text-sm text-muted">Opening the record...</p>
          ) : page.value.living ? (
            <p className="font-display text-lg text-fg/90">Living. Details are withheld for people who may be alive.</p>
          ) : (
            <div className="mx-auto grid max-w-[65ch] gap-5 text-fg/95">
              {page.value.summary ? (
                <div className="font-display text-lg leading-relaxed">
                  {page.value.summary.split("\n").map((l, i) => <p key={i}>{l}</p>)}
                </div>
              ) : null}
              {page.value.events.length ? (
                <section>
                  <h3 className="mb-1 text-sm tracking-wide text-muted uppercase">Events</h3>
                  <ul className="grid gap-1 text-sm">{page.value.events.map((e, i) => <li key={i}>{e.label}</li>)}</ul>
                </section>
              ) : null}
              <section className="grid gap-3 text-sm sm:grid-cols-3">
                {[["Parents", page.value.parents], ["Children", page.value.children]].map(([title, ids]) => (
                  <div key={title as string}>
                    <h3 className="mb-1 tracking-wide text-muted uppercase">{title as string}</h3>
                    {(ids as string[]).length ? <ul className="grid gap-1">{(ids as string[]).map((id) => relative(id))}</ul> : <p className="text-muted">None recorded</p>}
                  </div>
                ))}
                <div>
                  <h3 className="mb-1 tracking-wide text-muted uppercase">Spouses</h3>
                  {page.value.spouses.length ? <ul className="grid gap-1">{page.value.spouses.map((s) => relative(s.id))}</ul> : <p className="text-muted">None recorded</p>}
                </div>
              </section>
              {page.value.record ? (
                <section>
                  <h3 className="mb-1 text-sm tracking-wide text-muted uppercase">
                    GEDCOM record · {page.value.record.file} lines {page.value.record.start}-{page.value.record.end}
                  </h3>
                  <pre className="overflow-x-auto rounded-md border border-border bg-bg p-3 text-xs leading-relaxed">
                    {page.value.record.lines.map((l, i) => `${String(page.value.record!.start + i).padStart(5)}  ${l}`).join("\n")}
                  </pre>
                </section>
              ) : null}
            </div>
          )}
        </div>

        {roster.length > 1 ? (
          <footer className="flex items-center justify-between gap-2 border-t border-border p-3 sm:px-6">
            <button type="button" disabled={index <= 0} onClick={() => setIndex(index - 1)}
              className="inline-flex min-h-11 items-center gap-1 rounded-md px-3 text-sm text-fg disabled:text-faint">
              <ChevronLeft className="size-4" strokeWidth={1.75} /> Previous
            </button>
            <span className="text-xs text-muted tabular-nums">{Math.min(index, roster.length - 1) + 1} of {roster.length}</span>
            <button type="button" disabled={index >= roster.length - 1} onClick={() => setIndex(index + 1)}
              className="inline-flex min-h-11 items-center gap-1 rounded-md px-3 text-sm text-fg disabled:text-faint">
              Next <ChevronRight className="size-4" strokeWidth={1.75} />
            </button>
          </footer>
        ) : null}
      </article>
    </div>
  );
}
