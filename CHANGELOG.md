# Changelog

All notable changes to The Knowledge Press: The Family are recorded here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- A logo, `logo.svg`, in the README: an hourglass home tree inside the
  orchard's ring roads, its people colored by generation, and a pedigree
  under the title. In the same style as The Disulfides' logo.

- A GitHub Pages deploy of the orchard at
  https://flux-frontiers.github.io/kpress_family/, with a user guide
  (`docs/`, `mkdocs.yml`) built into `/docs/` beside it, as knowledge_press
  publishes its forest. The Web workflow reads the families from
  `families.tar.gz` on the draft `family-data` release, which
  `make families-publish` fills with the public demo families only
  (`PUBLIC_FAMILIES`: the Kennedys, the Tudors, George Washington's family).
  The start screen, the settings dialog and About link to the guide.
  `make docs-install`, `make docs` and `make docs-serve` build it locally.

- The web orchard, read from `genkg export-web` families in
  `web/public/families/`: one grove per surname, one tree per family line,
  each tree's wood the line's parent-to-child links, with married-in
  spouses as twigs.
- The home tree at the hub: one person's full hourglass, descendants as the
  crown and ancestors as roots under a glass floor over a lit pit.
  `?focal=<id>` picks the person; otherwise the fullest hourglass is used.
- "Show ancestors" on the hub card turns the home tree over: the focal
  person at the trunk and their ancestors rising as the crown, so they can
  be seen from the ground and not only through the glass.
- Marriages between lines as gold arcs in the god's-eye view.
- The record reader: a line's people, one page each, with relatives as
  links; living people show only that their details are withheld.
- The lantern search over names, birthplaces and years.
- The guided tour, which visits the groves in the order their families
  began and ends at the home tree.
- The album, with ranks: Reader, Clerk, Registrar, Archivist and Keeper of
  the Line.
- The cart carries each line in the album as a family album: a landscape
  volume bound in its grove's color, with brass corners, stacked in the bed.
- Schematic mode (V, or Settings): every tree drawn as a family diagram, each
  person a bead colored by generation and shaped by sex, straight barked
  limbs, brass marriage bars, and names over the nearest tree; living people
  are gray and unnamed. Tapping a bead opens that person's record. A
  couple's names sit one above and one below, and the beads glow faintly in
  their own colors so the diagram reads at night.
- "Make this the home tree" in the record reader regrows the orchard around
  that person and remembers the choice; `?focal=` still overrides it.
- New visitors start in the high view. Parked by a tall tree, the home tree
  too, either chase camera backs off and tilts up until the crown fits with
  the cart still in view.
- Several families: a choice on the start screen and `?family=`, each with
  its own album, groves visited and home person, and a home person of its
  own by default. `make family FAMILY=<slug>` adds one; `make demos` builds
  the Kennedys, the Tudors and George Washington's family from
  genealogy_kg's corpus, all with the living-person filter on, and the Lord
  of the Rings (home: Frodo) and the Simpsons (home: Bart).
- Each grove's stop plaza carries a monogram of its surname's initial in a
  script face (Pinyon Script), from one shared atlas, each letter centered
  on its ink rather than its advance box; the band and disc are geometry,
  so the marks cost one texture however many groves there are.
- The home person marked on their own line's tree out on the rings: the
  wood from the ground up to them gilded and a lantern where they are (in
  the schematic, the gold follows its straight limbs); their grove's
  signpost reads "the home line", a house marks it on the minimap, and the
  tour's card says so at its stop.
- Name plates over the people of the tree nearest the cart, in the wood view
  as in the schematic: the wooden trees grow from the same layout the
  schematic's beads come from, so one component hangs the plates in either.
  A "Name plates" setting (N) turns them off.
- The settings card opens at its top. It focused its "Back to the orchard"
  button on opening, at the bottom, and on a phone that scrolled the card
  down to it.
- One card per tour stop. On the ring, a passing tree's card no longer pops
  up on its own, and the stop's "On the ring" card carries the actions
  itself: add the line to the album and open its records, or browse the
  grove's lines. Before, the line card showed as the cart slowed, the grove
  card replaced it once stopped, and the line card came back on leaving.
- Rounded curbs where a spoke meets a ring, in place of the 3 m paved disc
  that covered every crossing: a 2 m fillet on each corner, the two inside
  ones at the outer ring's T. The tour's turns stay on the brick, tested
  wheel by wheel.
- Four spokes from the hub, reserved as lanes when the inner tier is seated,
  one before the grove nearest each quarter bearing, so they come out even.
  Before, a spoke took any gap that happened to clear 2 m, and the groves
  are seated 4 m apart, so which gaps passed was chance and all of a
  family's spokes could fall in one half of the wheel.
- Signpost faces have textures only within 70 m of the cart, and the species
  plates are shared across signs: a family's sign memory is bounded by what
  stands near you, not by its size. A board that comes into reach gets a
  fresh material, since one that merely gains a map keeps its old shader.
- Names written in capitals (the old GEDCOM way of marking a surname) read
  in title case; roman numerals stay.
- Privacy tests over the committed fixtures and git.

### Removed

- From the copy of The Knowledge Press: The Forest: the book catalog and
  reader, moots, diaries, the stoic quest, the space-colonization grower,
  the Flame of Knowledge, four wind sculptures, the compass rose and the
  Forest's feature backlog (`web/FEATURES.md`). See `PROVENANCE.md`.
