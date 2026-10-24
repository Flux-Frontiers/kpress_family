# Changelog

All notable changes to The Knowledge Press: The Family are recorded here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

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
  genealogy_kg's corpus, all with the living-person filter on.
- Names written in capitals (the old GEDCOM way of marking a surname) read
  in title case; roman numerals stay.
- Privacy tests over the committed fixtures and git.

### Removed

- From the copy of The Knowledge Press: The Forest: the book catalog and
  reader, moots, diaries, the stoic quest, the space-colonization grower,
  the Flame of Knowledge, four wind sculptures and the compass rose. See
  `PROVENANCE.md`.
