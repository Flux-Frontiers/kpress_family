import { Bell, BellOff, BookOpen, Camera, Check, Clock, Compass, Ellipsis, Eye, EyeOff, House, Info, Library, LogOut, MapPin, Moon, Settings2, Search, Sun, Sunrise, Sunset, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { COARSE_POINTER } from "./Environment";
import { exhibitApproach, type Exhibit } from "./exhibits";
import { lineMatchesQuery, groveApproach, searchTrees, treeApproach, type Forest, type Grove, type TreeSite } from "./forest";
import { GenreGlyph } from "./GenreGlyph";
import { SPECIES, speciesFor } from "./species";
import { saveScreenshot } from "./screenshot";
import { SEASONS } from "./seasons";
import { wrapAngle, yawToward } from "./sim";
import { FamilyReader } from "./FamilyReader";
import { READ_RANGE, useGame, type PlaqueText } from "./store";
import type { TimeMode } from "./sky";

const TIME_NAME = { dawn: "Dawn", day: "Day", dusk: "Dusk", night: "Night" } as const;

export function HUD({ forest }: { forest: Forest }) {
  const season = useGame((s) => s.season);
  const timeMode = useGame((s) => s.timeMode);
  const sunEvent = useGame((s) => s.sunEvent);
  const moonName = useGame((s) => s.moonName);
  // The sky ticks every few seconds; subscribing re-renders the clock with it.
  useGame((s) => s.sky);
  const clock = (d: Date) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const timeLabel = timeMode === "live" ? clock(new Date()) : TIME_NAME[timeMode];
  const timeTitle =
    timeMode === "live"
      ? `Live clock${sunEvent ? ` · ${sunEvent.kind} ${clock(sunEvent.at)}` : ""} · ${moonName} · tap for dawn`
      : timeMode === "night"
        ? `Night · ${moonName} · tap for the live clock`
        : `${TIME_NAME[timeMode]} · tap for ${TIME_NAME[timeMode === "dawn" ? "day" : timeMode === "day" ? "dusk" : "night"].toLowerCase()}`;
  const toggleTimeOfDay = useGame((s) => s.toggleTimeOfDay);
  const query = useGame((s) => s.query);
  const setQuery = useGame((s) => s.setQuery);
  const searchPick = useGame((s) => s.searchPick);
  const cardSlug = useGame((s) => s.cardSlug);
  const pinnedSlug = useGame((s) => s.pinnedSlug);
  const collect = useGame((s) => s.collect);
  const nearbyDismissed = useGame((s) => s.nearbyDismissed);
  const dismissNearby = useGame((s) => s.dismissNearby);
  const library = useGame((s) => s.library);
  const grovesVisited = useGame((s) => s.grovesVisited);
  const speed = useGame((s) => s.speed);
  const x = useGame((s) => s.x);
  const z = useGame((s) => s.z);
  const yaw = useGame((s) => s.yaw);
  const toast = useGame((s) => s.toast);
  const stats = useGame((s) => s.stats);
  const libraryOpen = useGame((s) => s.libraryOpen);
  const pause = useGame((s) => s.pause);
  const atlasOpen = useGame((s) => s.atlasOpen);
  const selectedGrove = useGame((s) => s.selectedGrove);
  const travelMode = useGame((s) => s.travelMode);
  const toggleCircuit = useGame((s) => s.toggleCircuit);
  const catalogOpen = useGame((s) => s.catalogOpen);
  const toggleCatalog = useGame((s) => s.toggleCatalog);
  const openCatalog = useGame((s) => s.openCatalog);
  const browsing = atlasOpen || catalogOpen || libraryOpen;
  const closeBrowse = () => useGame.setState({ atlasOpen: false, catalogOpen: false, libraryOpen: false });
  const [menuOpen, setMenuOpen] = useState(false);
  const plaque = useGame((s) => s.plaque);
  const readingSlug = useGame((s) => s.readingSlug);
  const openReader = useGame((s) => s.openReader);
  const reading = readingSlug ? forest.trees.find((t) => t.line.slug === readingSlug) : undefined;
  const clean = useGame((s) => s.cleanView);
  const toggleCleanView = useGame((s) => s.toggleCleanView);
  const silent = useGame((s) => s.preferences.silent);
  const godEye = useGame((s) => s.preferences.camera === "god" && !s.flight);
  const tourStop = useGame((s) => s.tourStop);
  const touring = tourStop ? forest.groves.find((g) => g.genre === tourStop) : undefined;
  const tourNote = useGame((s) => s.tourNote);
  const setPreferences = useGame((s) => s.setPreferences);

  // Silent mode keeps every card from popping up on its own; a tree the player picked still shows.
  const shownSlug = pinnedSlug ?? (silent ? null : cardSlug);
  const nearby = shownSlug ? forest.trees.find((t) => t.line.slug === shownSlug) : undefined;
  const showBook = Boolean(nearby && (pinnedSlug || nearby.line.slug !== nearbyDismissed));
  const bookDist = nearby ? Math.hypot(nearby.x - x, nearby.z - z) : Infinity;
  const pressed = nearby ? library.includes(nearby.line.slug) : false;
  // The redwood's card shows on the hub plaza; once closed it stays closed until the cart leaves.
  const hubDist = Math.hypot(x, z);
  const [redwoodClosed, setRedwoodClosed] = useState(false);
  const leftHub = hubDist > 20;
  useEffect(() => { if (leftHub) setRedwoodClosed(false); }, [leftHub]);
  const atRedwood = !silent && !pinnedSlug && hubDist < 16 && !redwoodClosed;
  const selected = forest.groves.find((g) => g.genre === selectedGrove);

  // Sorted from where the cart was when the query changed; re-sorting every pose tick would reshuffle the list under the pointer.
  const results = useMemo(() => {
    const { x, z } = useGame.getState();
    return searchTrees(forest, query, x, z);
  }, [forest, query]);
  const matches = results.length;
  const picked = searchPick ? results.find((t) => t.line.slug === searchPick) : undefined;

  const bearing = selected
    ? wrapAngle(yawToward(x, z, selected.x, selected.z) - yaw)
    : 0;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-fg">
      <header className="pointer-events-none flex items-start justify-between gap-3 p-3 sm:p-4">
        {clean ? null : (
          <div className="rounded-lg border border-border bg-surface/90 px-3 py-2">
            <p className="font-display text-lg leading-none">The Family</p>
            <p className="mt-1 text-xs text-muted">
              {forest.trees.length} trees · {SEASONS[season].label}
              {" · "}
              {timeLabel}
              {travelMode === "circuit" ? " · ring" : ""}
            </p>
            {stats ? (
              <p className="mt-1 font-mono text-[11px] text-faint tabular-nums">
                {(stats.tris / 1e6).toFixed(2)}M tris · {stats.calls} calls · {(forest.leaves.count / 1000).toFixed(0)}k leaves · {stats.fps.toFixed(0)} fps
              </p>
            ) : null}
          </div>
        )}
        <div className="ml-auto flex flex-col items-end gap-2">
          {/* Phones keep Home, Browse and a menu in the bar; the other buttons join them from sm up. */}
          <div className="pointer-events-auto relative flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => { toggleCleanView(); (document.activeElement as HTMLElement | null)?.blur(); }}
              className={"size-11 place-items-center rounded-md border border-border bg-surface " + (clean ? "grid" : "hidden sm:grid")}
              aria-label={clean ? "Show the buttons again" : "Clean view: hide the buttons, keep the map"}
              title={clean ? "Show the buttons" : "Clean view"}
            >
              {clean ? <Eye className="size-4" strokeWidth={1.75} /> : <EyeOff className="size-4" strokeWidth={1.75} />}
            </button>
            <button
              type="button"
              onClick={() => { saveScreenshot(COARSE_POINTER); (document.activeElement as HTMLElement | null)?.blur(); }}
              className={"size-11 place-items-center rounded-md border border-border bg-surface " + (clean ? "grid" : "hidden sm:grid")}
              aria-label="Save a screenshot of the forest" title="Screenshot"
            >
              <Camera className="size-4" strokeWidth={1.75} />
            </button>
            {clean ? null : (<>
              <button
                type="button"
                onClick={toggleTimeOfDay}
                className="hidden size-11 place-items-center rounded-md border border-border bg-surface sm:grid"
                aria-label={timeTitle}
                title={timeTitle}
              >
                <TimeIcon mode={timeMode} />
              </button>
              <button
                type="button"
                onClick={() => setPreferences({ silent: !silent })}
                className="hidden size-11 place-items-center rounded-md border border-border bg-surface sm:grid"
                aria-label={silent ? "Silent mode on: turn pop-up cards back on" : "Turn on silent mode: no pop-up cards"}
                title={silent ? "Silent · tap for pop-up cards" : "Pop-up cards · tap for silent"}
              >
                {silent ? <BellOff className="size-4" strokeWidth={1.75} /> : <Bell className="size-4" strokeWidth={1.75} />}
              </button>
              <button
                type="button"
                onClick={() => { jumpHome(forest); (document.activeElement as HTMLElement | null)?.blur(); }}
                className="grid size-11 place-items-center rounded-md border border-border bg-surface"
                aria-label="Home: back to the home tree" title="Home · H"
              >
                <House className="size-4" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => (browsing ? closeBrowse() : openCatalog(null))}
                className={
                  "inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm " +
                  (browsing ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface")
                }
                aria-label={`Browse the groves, every line and your album (${library.length} collected)`}
                title="Groves · G, Lines · B, Album · L"
              >
                <Library className="size-4" strokeWidth={1.75} />
                <span className="hidden sm:inline">Browse</span>
                {library.length ? <span className="tabular-nums">{library.length}</span> : null}
              </button>
              <button
                type="button"
                onClick={() => pause(true)}
                className="hidden size-11 place-items-center rounded-md border border-border bg-surface sm:grid"
                aria-label="Controls and settings" title="Controls and settings · Esc"
              >
                <Settings2 className="size-4" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => useGame.getState().toggleHelp()}
                className="hidden size-11 place-items-center rounded-md border border-border bg-surface sm:grid"
                aria-label="About the forest and tonight's sky" title="About · ?"
              >
                <Info className="size-4" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => useGame.getState().exit()}
                className="hidden size-11 place-items-center rounded-md border border-border bg-surface sm:grid"
                aria-label="Exit to the start screen" title="Exit to the start screen"
              >
                <LogOut className="size-4" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className={
                  "grid size-11 place-items-center rounded-md border sm:hidden " +
                  (menuOpen ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface")
                }
                aria-label="More: time of day, silent mode, screenshot, clean view, moots, settings, about, exit"
                aria-expanded={menuOpen}
              >
                <Ellipsis className="size-4" strokeWidth={1.75} />
              </button>
              {menuOpen ? (<>
                <div className="fixed inset-0 z-30 sm:hidden" onClick={() => setMenuOpen(false)} aria-hidden />
                <ul className="absolute top-full right-0 z-40 mt-2 w-60 rounded-lg border border-border bg-surface py-1 sm:hidden">
                  <MenuItem icon={<TimeIcon mode={timeMode} />} label={`Time of day · ${timeMode === "live" ? "live" : TIME_NAME[timeMode].toLowerCase()}`} onClick={toggleTimeOfDay} />
                  <MenuItem icon={silent ? <BellOff className="size-4" strokeWidth={1.75} /> : <Bell className="size-4" strokeWidth={1.75} />}
                    label={silent ? "Silent · no pop-up cards" : "Pop-up cards on"} onClick={() => setPreferences({ silent: !silent })} />
                  <MenuItem icon={<Camera className="size-4" strokeWidth={1.75} />} label="Screenshot"
                    onClick={() => { setMenuOpen(false); saveScreenshot(COARSE_POINTER); }} />
                  <MenuItem icon={<EyeOff className="size-4" strokeWidth={1.75} />} label="Clean view"
                    onClick={() => { setMenuOpen(false); toggleCleanView(); }} />
                  <MenuItem icon={<Settings2 className="size-4" strokeWidth={1.75} />} label="Controls and settings"
                    onClick={() => { setMenuOpen(false); pause(true); }} />
                  <MenuItem icon={<Info className="size-4" strokeWidth={1.75} />} label="About and tonight's sky"
                    onClick={() => { setMenuOpen(false); useGame.getState().toggleHelp(); }} />
                  <MenuItem icon={<LogOut className="size-4" strokeWidth={1.75} />} label="Exit to the start screen"
                    onClick={() => { setMenuOpen(false); useGame.getState().exit(); }} />
                </ul>
              </>) : null}
            </>)}
          </div>

          {/* Under the buttons, not at a fixed offset, so a wrapped button row can never cover it. */}
          <div className="pointer-events-auto w-28 sm:w-40">
            <Minimap forest={forest} x={x} z={z} yaw={yaw} pins={query.trim() ? results : []} picked={searchPick} />
            {selected ? (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ background: selected.color }}
                />
                <span className="truncate">{selected.label}</span>
                <span
                  className="ml-auto inline-block size-0 border-x-4 border-b-[7px] border-x-transparent border-b-fg"
                  style={{ transform: `rotate(${bearing}rad)` }}
                  aria-hidden
                />
              </p>
            ) : (
              <p className="mt-1 text-xs text-faint">Tap a grove for its lines</p>
            )}
          </div>
        </div>
      </header>

      {clean ? null : (<>
        {/* Bottom-centre above the key hints, results opening upward; touch layouts move it (styles.css). */}
        <div className="search-dock pointer-events-auto z-20 mx-auto flex w-[min(100%-1.5rem,28rem)] flex-col gap-1 sm:absolute sm:bottom-9 sm:left-1/2 sm:mx-0 sm:w-[22rem] sm:-translate-x-1/2 sm:flex-col-reverse">
          <label className="flex items-center gap-2 rounded-md border border-border bg-surface/90 px-3 py-2">
            <Search className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && results[0]) jumpToTree(results[0]);
                if (e.key === "Escape") e.currentTarget.blur();
              }}
              placeholder="Search names, places, years: boston 1917"
              className="min-h-7 w-full bg-transparent text-sm text-fg outline-none placeholder:text-faint"
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear the query and the lantern trail"
                className="-my-2 -mr-2 grid size-9 shrink-0 place-items-center rounded-md text-muted">
                <X className="size-4" strokeWidth={1.75} />
              </button>
            ) : null}
          </label>
          {query.trim() ? (
            <p className="px-1 text-xs text-muted sm:rounded-sm sm:bg-surface/80 sm:py-0.5">
              {matches} tree{matches === 1 ? "" : "s"} answering
              {picked ? ` · lantern points to ${picked.line.title}` : selected ? "" : " · lantern points to the nearest"}
            </p>
          ) : null}
          {query.trim() && matches && !picked ? (
            <ul className="max-h-[40vh] overflow-auto rounded-md border border-border bg-surface/95 sm:max-h-72">
              {results.slice(0, 30).map((t) => (
                <li key={t.line.slug}>
                  <button type="button" onClick={() => jumpToTree(t)}
                    className="flex min-h-11 w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-bg">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: t.color }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm leading-snug">{t.line.title}</span>
                      <span className="block truncate text-xs text-muted">{t.line.founders} · {t.line.surname}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted tabular-nums">{Math.round(Math.hypot(t.x - x, t.z - z))} m</span>
                    <span className="shrink-0 text-xs text-primary">Jump</span>
                  </button>
                </li>
              ))}
              {matches > 30 ? <li className="px-3 py-2 text-xs text-faint">{matches - 30} more; narrow the query</li> : null}
            </ul>
          ) : null}
        </div>
      </>)}

      {clean ? null : (<>
        <div className="book-dock pointer-events-auto absolute bottom-24 left-3 right-3 mx-auto max-w-lg sm:bottom-6 sm:left-4 sm:right-auto sm:max-w-[min(32rem,calc(50%-12rem))]">
          {touring && !silent ? (
            <article className="rounded-lg border border-border bg-surface/94 p-3 sm:p-4" aria-live="polite">
              <p className="flex items-center gap-2 text-xs tracking-wide text-muted uppercase">
                <span className="inline-block size-2 rounded-full" style={{ background: touring.color }} />
                On the ring
              </p>
              <h2 className="font-display mt-0.5 text-xl leading-tight sm:text-2xl">{touring.label}</h2>
              {/* The heading already names the grove; the spoken text starts with it. */}
              <p className="mt-2 text-sm leading-relaxed text-fg/90">{touring.narration.replace(`${touring.label}: `, "").replace(/^./, (c) => c.toUpperCase())}</p>
            </article>
          ) : tourNote && !silent ? (
            <article className="rounded-lg border border-border bg-surface/94 p-3 sm:p-4" aria-live="polite">
              <p className="flex items-center gap-2 text-xs tracking-wide text-muted uppercase">On the ring</p>
              <p className="mt-1 text-sm leading-relaxed text-fg/90">{tourNote}</p>
            </article>
          ) : atRedwood ? (
            <article className="relative rounded-lg border border-border bg-surface/94 p-3 pr-12 sm:p-4 sm:pr-14">
              <button
                type="button"
                onClick={() => setRedwoodClosed(true)}
                className="absolute top-1.5 right-1.5 grid size-11 place-items-center rounded-md text-muted"
                aria-label="Dismiss"
              >
                <X className="size-5" strokeWidth={1.75} />
              </button>
              <p className="text-xs tracking-wide text-muted uppercase">The hub</p>
              <h2 className="font-display mt-0.5 text-xl leading-tight sm:text-2xl">{forest.corpusTree.focalName}</h2>
              <p className="text-sm text-muted tabular-nums">
                {forest.corpusTree.totalChunks.toLocaleString("en-US")} people · {forest.trees.length} lines · {Math.round(forest.corpusTree.height)} m
              </p>
              <p className="card-extra mt-2 hidden text-sm leading-relaxed text-fg/90 sm:block">
                The home tree: ancestors as roots under the glass, descendants as the crown. Browse every line and jump to any one.
              </p>
              <button type="button" onClick={toggleCatalog}
                className="mt-3 min-h-11 rounded-md bg-primary px-4 text-sm text-primary-fg">
                Browse every line · B
              </button>
            </article>
          ) : showBook && nearby ? (
            <article className="relative rounded-lg border border-border bg-surface/94 p-3 pr-12 sm:p-4 sm:pr-14">
              <button
                type="button"
                onClick={dismissNearby}
                className="absolute top-1.5 right-1.5 grid size-11 place-items-center rounded-md text-muted"
                aria-label="Dismiss"
              >
                <X className="size-5" strokeWidth={1.75} />
              </button>
              <p className="text-xs tracking-wide text-muted uppercase">{nearby.line.surname}</p>
              <h2 className="font-display mt-0.5 text-xl leading-tight sm:text-2xl">{nearby.line.title}</h2>
              <p className="text-sm text-muted">{nearby.line.founders}</p>
              <p className="card-extra mt-1 hidden text-xs text-faint tabular-nums sm:block">
                {nearby.line.members.toLocaleString()} {nearby.line.members === 1 ? "person" : "people"}{nearby.line.span ? ` · ${nearby.line.span}` : ""}
              </p>
              <p className="card-extra mt-2 hidden text-sm leading-relaxed text-fg/90 sm:block">{nearby.line.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {pressed ? (
                  <p className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-primary/60 px-4 text-sm text-fg">
                    <Check className="size-4 text-primary" strokeWidth={2} /> In your album
                  </p>
                ) : (
                  <button type="button" disabled={bookDist >= READ_RANGE}
                    onClick={() => collect(nearby.line.slug, nearby.line.title)}
                    className="min-h-11 rounded-md bg-primary px-4 text-sm text-primary-fg disabled:bg-bg disabled:text-muted">
                    {bookDist < READ_RANGE ? "Add to the album · E" : `Move closer · ${Math.ceil(bookDist)} m`}
                  </button>
                )}
                <button type="button" onClick={() => openReader(nearby.line.slug)}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border px-4 text-sm text-fg">
                  <BookOpen className="size-4" strokeWidth={1.75} /> Open the records
                </button>
                {godEye ? (
                  <button type="button" onClick={() => flyToTree(nearby)}
                    className="min-h-11 rounded-md border border-primary/60 px-4 text-sm text-fg">
                    Fly there
                  </button>
                ) : null}
              </div>
            </article>
          ) : null}
        </div>

        <div className="season-dock pointer-events-auto absolute right-3 bottom-24 hidden flex-col gap-1 sm:flex">
          <button
            type="button"
            onClick={() => { toggleCircuit(); (document.activeElement as HTMLElement | null)?.blur(); }}
            className={
              "rounded-sm px-2 py-1 text-xs " +
              (travelMode === "circuit" ? "bg-primary text-primary-fg" : "border border-border bg-surface text-muted")
            }
          >
            {travelMode === "circuit" ? "On the ring" : "Ride the ring"}
          </button>
        </div>

        <p className="key-hints absolute bottom-3 left-1/2 hidden -translate-x-1/2 text-xs text-faint sm:block">
          WASD drive · Drag or arrows look · Space brake · E album · B lines · C camera · Esc settings · ? about
        </p>
      </>)}

      {toast ? (
        <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 rounded-md border border-border bg-surface px-4 py-2 text-sm">
          {toast}
        </div>
      ) : null}

      {browsing ? <BrowsePanel forest={forest} /> : null}
      {plaque ? <PlaquePanel plaque={plaque} /> : null}
      {reading ? <FamilyReader key={reading.line.slug} line={reading.line} /> : null}
    </div>
  );
}

function TimeIcon({ mode }: { mode: TimeMode }) {
  const Icon = { live: Clock, dawn: Sunrise, day: Sun, dusk: Sunset, night: Moon }[mode];
  return <Icon className="size-4" strokeWidth={1.75} />;
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick}
        className="flex min-h-11 w-full items-center gap-3 px-3 text-left text-sm hover:bg-bg">
        {icon}
        {label}
      </button>
    </li>
  );
}

function jumpToGrove(g: Grove) {
  const wp = groveApproach(g);
  // Arriving, not navigating: no trail to a grove the cart is about to stand at.
  useGame.getState().selectGrove(null);
  useGame.getState().requestJump({ x: wp.x, z: wp.z, yaw: wp.yaw }, `${g.label} grove`);
}

function jumpToTree(t: TreeSite) {
  const s = useGame.getState();
  s.selectGrove(null);
  s.pickSearch(t.line.slug);
  s.pinTree(t.line.slug);
  s.requestJump(treeApproach(t, s.x, s.z), t.line.title);
  (document.activeElement as HTMLElement | null)?.blur();
}

/** From god's eye: put the cart at the tree and dive the camera down to it. */
function flyToTree(t: TreeSite) {
  const s = useGame.getState();
  s.selectGrove(null);
  s.pinTree(t.line.slug);
  s.flyTo(treeApproach(t, s.x, s.z), t.line.title);
}

function jumpHome(forest: Forest) {
  useGame.getState().selectGrove(null);
  useGame.getState().requestJump(forest.home, "Home · the home tree");
}

function jumpToExhibit(e: Exhibit) {
  useGame.getState().selectGrove(null);
  useGame.getState().requestJump(exhibitApproach(e), e.label);
}

function Minimap({ forest, x, z, yaw, pins, picked }: {
  forest: Forest; x: number; z: number; yaw: number; pins: TreeSite[]; picked: string | null;
}) {
  const selectedGrove = useGame((s) => s.selectedGrove);
  const r = forest.worldRadius;
  const to = (wx: number, wz: number) => {
    const px = ((wx + r) / (2 * r)) * 100;
    const pz = ((wz + r) / (2 * r)) * 100;
    return { left: `${px}%`, top: `${pz}%` };
  };
  const p = to(x, z);
  return (
    <div className="relative h-28 w-28 overflow-hidden rounded-lg border border-border bg-bg/80 sm:h-40 sm:w-40">
      <Compass className="absolute top-1.5 left-1.5 size-3 text-muted" strokeWidth={1.75} />
      <button
        type="button"
        className="absolute size-2 rounded-full bg-fg/70"
        style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
        aria-label="Home: back to the home tree"
        onClick={() => jumpHome(forest)}
      />
      {forest.exhibits.map((e) => {
        const c = to(e.x, e.z);
        return (
          <button key={e.id} type="button" onClick={() => jumpToExhibit(e)}
            className="absolute size-2 border border-bg bg-[#c9a24a]"
            style={{ left: c.left, top: c.top, transform: "translate(-50%, -50%) rotate(45deg)", zIndex: 1 }}
            title={`Jump to ${e.label}`} aria-label={`Jump to ${e.label}`} />
        );
      })}
      {forest.groves.map((g) => {
        const c = to(g.x, g.z);
        const size = Math.max(10, (g.radius / r) * 80);
        const on = selectedGrove === g.genre;
        return (
          <button
            key={g.genre}
            type="button"
            className="absolute rounded-full"
            style={{
              left: c.left,
              top: c.top,
              width: size,
              height: size,
              background: g.color,
              opacity: on ? 1 : 0.72,
              transform: "translate(-50%, -50%)",
              boxShadow: on ? `0 0 0 2px var(--color-fg)` : "none",
            }}
            title={`${g.label}: its lines`}
            aria-label={`${g.label}: list its lines`}
            onClick={() => useGame.getState().openCatalog(g.genre)}
          />
        );
      })}
      {pins.slice(0, 200).map((t) => {
        const c = to(t.x, t.z);
        const on = t.line.slug === picked;
        return (
          <button key={t.line.slug} type="button" onClick={() => jumpToTree(t)}
            className="absolute rounded-full border border-bg bg-primary"
            style={{ left: c.left, top: c.top, width: on ? 10 : 6, height: on ? 10 : 6, transform: "translate(-50%, -50%)", zIndex: on ? 2 : 1 }}
            title={`Jump to ${t.line.title}`} aria-label={`Jump to ${t.line.title}`} />
        );
      })}
      {picked && pins.some((t) => t.line.slug === picked) ? (() => {
        const t = pins.find((p) => p.line.slug === picked)!;
        const c = to(t.x, t.z);
        return <MapPin className="pointer-events-none absolute size-4 text-primary" strokeWidth={2}
          style={{ left: c.left, top: c.top, transform: "translate(-50%, -100%)", zIndex: 3 }} aria-hidden />;
      })() : null}
      <span
        className="pointer-events-none absolute h-0 w-0 border-x-4 border-b-8 border-x-transparent border-b-fg"
        style={{
          left: p.left,
          top: p.top,
          transform: `translate(-50%, -70%) rotate(${-yaw}rad)`,
        }}
      />
    </div>
  );
}

/** The groves, every line and the album as tabs of one panel; G, B and L open their tabs. */
function BrowsePanel({ forest }: { forest: Forest }) {
  const atlasOpen = useGame((s) => s.atlasOpen);
  const libraryOpen = useGame((s) => s.libraryOpen);
  const library = useGame((s) => s.library);
  const tab = atlasOpen ? "groves" : libraryOpen ? "press" : "books";
  const close = () => useGame.setState({ atlasOpen: false, catalogOpen: false, libraryOpen: false });
  const tabs = [
    { id: "groves", label: "Groves", open: () => useGame.getState().toggleAtlas() },
    { id: "books", label: "Lines", open: () => useGame.getState().openCatalog(null) },
    { id: "press", label: `Album · ${library.length}`, open: () => useGame.getState().toggleLibrary() },
  ] as const;

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-30 flex items-start justify-center bg-bg/45 p-3 sm:p-6"
      onClick={close}
    >
      <div
        className="flex max-h-[84vh] w-full max-w-xl flex-col rounded-xl border border-border bg-surface p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div role="tablist" className="flex gap-1 rounded-md bg-bg p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={tab === t.id ? undefined : t.open}
                className={
                  "min-h-10 rounded-sm px-3 text-sm tabular-nums " +
                  (tab === t.id ? "bg-primary text-primary-fg" : "text-muted")
                }
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={close}
            className="grid size-11 place-items-center rounded-md text-muted"
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </div>
        {tab === "groves" ? <GrovesTab forest={forest} /> : tab === "press" ? <PressTab forest={forest} /> : <BooksTab forest={forest} />}
      </div>
    </div>
  );
}

function GrovesTab({ forest }: { forest: Forest }) {
  const grovesVisited = useGame((s) => s.grovesVisited);
  const selectedGrove = useGame((s) => s.selectedGrove);

  return (<>
    <p className="mt-2 text-sm text-muted">Jump to an exhibit or a grove. The cart stays yours; steer to hop off.</p>
    <ul className="mt-3 min-h-0 flex-1 space-y-1 overflow-auto">
      {forest.exhibits.map((e) => (
        <li key={e.id}>
          <button type="button" onClick={() => jumpToExhibit(e)}
            className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left hover:bg-bg">
            <span className="size-2.5 shrink-0 rotate-45 bg-[#c9a24a]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium leading-snug">{e.label}</span>
              <span className="block text-xs text-muted">Exhibit</span>
            </span>
            <span className="text-xs text-primary">Jump</span>
          </button>
        </li>
      ))}
      {forest.groves.map((g) => {
        const visited = grovesVisited.includes(g.genre);
        const on = selectedGrove === g.genre;
        return (
          <li key={g.genre}>
            <button
              type="button"
              onClick={() => jumpToGrove(g)}
              className={
                "flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left " +
                (on ? "bg-primary/15" : "hover:bg-bg")
              }
            >
              <GenreGlyph genre={g.genre} className="size-6 shrink-0" style={{ color: g.color }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium leading-snug">{g.label}</span>
                <span className="block text-xs text-muted">
                  {g.bookCount} trees{visited ? " · visited" : ""}
                </span>
              </span>
              <span className="text-xs text-primary">Jump</span>
            </button>
          </li>
        );
      })}
    </ul>
  </>);
}

function PressTab({ forest }: { forest: Forest }) {
  const library = useGame((s) => s.library);
  const collected = forest.trees.filter((t) => library.includes(t.line.slug));

  return (<>
    <p className="mt-2 text-sm text-muted">
      {collected.length} collected of {forest.trees.length}
    </p>
    <ul className="mt-3 min-h-0 flex-1 space-y-2 overflow-auto">
      {collected.length === 0 ? (
        <li className="text-sm text-faint">Drive to a tree and press E to add its line.</li>
      ) : (
        collected.map((t) => (
          <li key={t.line.slug} className="flex items-start justify-between gap-3 border-b border-border pb-2">
            <div>
              <p className="font-medium leading-snug">{t.line.title}</p>
              <p className="text-xs text-muted">
                {t.line.founders} · {t.line.surname}
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <button type="button" className="text-xs text-primary" onClick={() => useGame.getState().openReader(t.line.slug)}>
                Open
              </button>
              <button
                type="button"
                className="text-xs text-primary"
                onClick={() => {
                  const g = forest.groves.find((gr) => gr.genre === t.line.grove);
                  if (g) jumpToGrove(g);
                }}
              >
                Grove
              </button>
            </div>
          </li>
        ))
      )}
    </ul>
    {collected.length > 0 && (
      <button type="button" className="mt-3 min-h-11 w-full rounded-md border border-border text-sm text-muted"
        onClick={() => { if (window.confirm("Empty the album? Every line comes out.")) useGame.getState().emptyPress(); }}>
        Empty the album
      </button>
    )}
  </>);
}

/** Every line in the family, grouped by grove: filter, then jump to its tree. */
function BooksTab({ forest }: { forest: Forest }) {
  const library = useGame((s) => s.library);
  const genre = useGame((s) => s.catalogGenre);
  const only = genre ? forest.groves.find((g) => g.genre === genre) : undefined;
  const [filter, setFilter] = useState("");
  const q = filter.trim();
  const sections = forest.groves
    .filter((g) => !only || g === only)
    .map((g) => ({
      grove: g,
      trees: forest.trees
        .filter((t) => t.line.grove === g.genre && (!q || lineMatchesQuery(t.line, q)))
        .sort((a, b) => a.line.title.localeCompare(b.line.title)),
    }))
    .filter((s) => s.trees.length);
  const shown = sections.reduce((n, s) => n + s.trees.length, 0);

  return (<>
    {only ? (<>
      <h2 className="mt-2 font-display text-2xl">{only.label}</h2>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => jumpToGrove(only)}
          className="min-h-11 rounded-md bg-primary px-4 text-sm text-primary-fg">
          Go to the grove
        </button>
        <button type="button" onClick={() => useGame.getState().openCatalog(null)}
          className="min-h-11 rounded-md border border-border bg-bg px-4 text-sm">
          All {forest.trees.length} lines
        </button>
      </div>
    </>) : (
      <p className="mt-2 text-sm text-muted tabular-nums">
        {q ? `${shown} of ${forest.trees.length}` : `${forest.trees.length} lines`} · {forest.trees.reduce((n, t) => n + t.line.members, 0).toLocaleString("en-US")} people. Pick one to jump to its tree.
      </p>
    )}
    <label className="mt-3 flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2">
      <Search className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
      <input
        autoFocus={!COARSE_POINTER}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        onKeyDown={(e) => {
          const first = sections[0]?.trees[0];
          if (e.key === "Enter" && first) jumpToTree(first);
        }}
        placeholder="Filter by title, author, genre"
        className="min-h-7 w-full bg-transparent text-sm text-fg outline-none placeholder:text-faint"
      />
    </label>
    <div className="mt-3 min-h-0 flex-1 overflow-auto">
      {sections.length === 0 ? <p className="px-1 text-sm text-faint">No line matches.</p> : null}
      {sections.map(({ grove, trees }) => (
        <section key={grove.genre} className="mb-3">
          <h3 className="sticky top-0 bg-surface px-1 py-1 text-xs tracking-wide text-muted uppercase">
            <span className="flex items-center gap-2">
              <GenreGlyph genre={grove.genre} className="size-4 shrink-0" style={{ color: grove.color }} />
              {grove.label} · {trees.length}
            </span>
            {/* The grove's species, so the list says what the trees are. */}
            <span className="block pl-6 text-[11px] tracking-normal normal-case text-faint">
              {SPECIES[speciesFor(grove.genre)]!.common} · <i>{SPECIES[speciesFor(grove.genre)]!.latin}</i>
            </span>
          </h3>
          <ul>
            {trees.map((t) => (
              <li key={t.line.slug}>
                <button type="button" onClick={() => jumpToTree(t)}
                  className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-1.5 text-left hover:bg-bg">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm leading-snug">{t.line.title}</span>
                    <span className="block truncate text-xs text-muted">
                      {t.line.founders} · {t.line.members.toLocaleString("en-US")} {t.line.members === 1 ? "person" : "people"}{library.includes(t.line.slug) ? " · in the album" : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-primary">Jump</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  </>);
}

/** An exhibit's plaque at reading size, in the plaque's own cream, ink and brass (makePlaqueTexture). */
function PlaquePanel({ plaque }: { plaque: PlaqueText }) {
  const close = () => useGame.getState().openPlaque(null);
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-bg/55 p-3 sm:p-6" onClick={close}>
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="plaque-title"
        className="relative max-h-[86vh] w-full max-w-2xl overflow-auto rounded-md border-[6px] border-[#3a322c] bg-[#efe8dc] p-2 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-2 border-[#c9a24a] px-6 py-6 sm:px-9 sm:py-8">
          <button
            type="button"
            autoFocus
            onClick={close}
            className="absolute top-5 right-5 grid size-11 place-items-center rounded-md text-[#5a4a3a]"
            aria-label="Close the plaque"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
          <h2 id="plaque-title" className="pr-10 font-display text-3xl font-semibold text-[#1a2030] italic sm:text-4xl">{plaque.title}</h2>
          <p className="mt-1 text-sm font-semibold tracking-wide text-[#8a6a22]">{plaque.byline}</p>
          <p className="mt-5 text-base leading-relaxed text-[#2a2a2a] sm:text-lg">{plaque.body}</p>
        </div>
      </article>
    </div>
  );
}
