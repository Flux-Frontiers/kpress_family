import { useEffect, useRef } from "react";
import { COARSE_POINTER } from "./Environment";
import { NightSky } from "./NightSky";
import { useGame } from "./store";

/** Every control, keyboard first; a touch screen gets its own list. */
const KEYS: [string, string][] = [
  ["W / S", "drive forward, reverse"],
  ["A / D", "steer"],
  ["Drag, or arrows", "look around; the view eases back to ahead when you let go, the tilt stays"],
  ["Shift / Space", "hurry / brake"],
  ["E", "add the nearest tree's line to your album"],
  ["G / B / L", "the grove atlas, every line, your album"],
  ["H / Q", "home to the home tree / the guided tour"],
  ["C", "camera: behind, high, in the cart, god's eye"],
  ["?", "this page"],
  ["Esc", "close a panel; with none open, settings"],
];

const TOUCH: [string, string][] = [
  ["Stick, bottom left", "drive: up forward, down reverse, sideways to steer"],
  ["Drag anywhere else", "look around; the view eases back to ahead when you let go"],
  ["Add", "the nearest tree's line to your album, once you are close"],
  ["Guided tour", "the cart drives the ring and stops at each grove"],
  ["Three-dot menu", "time of day, silent mode, screenshot, settings, this page"],
];

/**
 * What the forest is, what is in it, what is in tonight's sky, and how to get
 * around: the long form of the start screen. Opened with ?, the About button
 * in the bar or the phone's three-dot menu, or About on the start screen.
 */
export function About() {
  const open = useGame((s) => s.helpOpen);
  const toggle = useGame((s) => s.toggleHelp);
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
      close.current?.focus();
    } else dialog.current?.close();
  }, [open]);

  return (
    <dialog ref={dialog} aria-labelledby="about-title" onCancel={(e) => { e.preventDefault(); toggle(); }}
      onClick={(e) => { if (e.target === e.currentTarget) toggle(); }}
      className="about m-auto max-h-[90dvh] w-[min(100%-2rem,40rem)] overflow-auto rounded-xl border border-border bg-surface text-fg shadow-2xl">
      {/* Padding inside, so a click on the dialog itself is a click on the backdrop. */}
      <div className="p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.2em] text-primary uppercase">The Knowledge Press: The Family</p>
          <h2 id="about-title" className="mt-1 font-display text-3xl">About the orchard</h2>
        </div>
        <button ref={close} type="button" aria-label="Close" onClick={toggle}
          className="grid size-11 shrink-0 place-items-center rounded-md border border-border text-xl leading-none">×</button>
      </header>

      <div className="about-body mt-4 text-sm leading-relaxed text-muted">
        <p className="text-base text-fg">
          The orchard is a picture of a family. Each family line, the people born with one surname, is one tree,
          and the tree is the line itself: its founder is the trunk, every limb runs from a parent to a child, and
          each person is a tuft of leaves. A spouse who married in hangs as a twig at the fork.
        </p>

        <h3>A surname is a grove</h3>
        <p>
          The lines of a surname stand together in a grove, and each surname grows as one species. The groves ring
          the home tree at the hub: one person's whole family, their descendants as the crown and their ancestors
          as the roots, seen through the glass floor of the pit below it. Overhead, gold arcs join the trees of
          lines that married.
        </p>

        <h3>The sky</h3>
        <p>
          The sky is real astronomy, placed for your time and place: the sun, the moon in its true phase, the 5,080
          stars of the Yale Bright Star Catalogue, the five naked-eye planets, and meteors at tonight's real rates,
          each shower in season falling from its radiant among the stars. Twilight washes out the faint stars first,
          and the moon hides whatever is behind it. Fog and cloud hide the lot. Choose Dawn, Day, Dusk or Night with
          the clock, or Live for your own sky right now.
        </p>

        {/* Mounted only while open, so each opening reads the sky for now. */}
        {open && <NightSky />}

        <h3>Getting around</h3>
        <dl className="about-keys">
          {(COARSE_POINTER ? TOUCH : KEYS).map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
        {!COARSE_POINTER && (
          <p className="text-faint">On a phone: the stick at bottom left drives, a drag anywhere else looks. A gamepad works too.</p>
        )}

        <h3>How it was made</h3>
        <p>
          The family comes from a GEDCOM file, indexed by GenealogyKG, with people who may be living withheld. Each
          tree is laid out in code from the family's own kinship, and every limb is as thick as the family it
          carries. The orchard is built with three.js and React. The astronomy is SunCalc's; the stars are the Yale
          Bright Star Catalogue (Hoffleit &amp; Warren, 1991); the planets follow JPL's approximate Keplerian elements
          (Standish) with magnitudes from Mallama &amp; Hilton (2018); the moon is NASA's Lunar Reconnaissance
          Orbiter color mosaic.
        </p>
      </div>
      </div>
    </dialog>
  );
}
