# Release Notes -- v0.1.0

> Released: 2026-10-29

The first release of The Family, the second volume of The Knowledge Press.
It reads a GenealogyKG store built from a GEDCOM file and grows it as an
orchard you drive through in the browser: one grove for each surname, one
tree for each family line, and every tree's wood the kinship graph itself.
The orchard is published at https://flux-frontiers.github.io/kpress_family/
with three public families, and its user guide at
https://flux-frontiers.github.io/kpress_family/docs/.

## What changed

**The orchard.** Each line's tree grows from its parent-to-child links, with
married-in spouses as twigs. Marriages between lines show as gold arcs in the
god's-eye view. The groves stand on rings around a hub, with four spokes
spaced evenly around the wheel and rounded curbs where the roads meet.

**The home tree.** At the hub stands one person's full hourglass: their
descendants as the crown and their ancestors as roots, seen through a glass
floor over a lit pit. "Show ancestors" turns it over so the ancestors rise as
the crown. "Make this the home tree" in the record reader regrows the orchard
around anyone, and the home person is marked on their own line's tree out on
the rings, the wood up to them gilded and a lantern where they stand.

**Reading the family.** The record reader gives each person a page, with
relatives as links. The lantern search covers names, birthplaces and years.
The guided tour visits the groves in the order their families began and ends
at the home tree. Lines added to the album ride in the cart as bound family
albums, and the album's ranks run from Reader to Keeper of the Line.

**Schematic mode.** V draws every tree as a family diagram: each person a
bead colored by generation and shaped by sex, brass marriage bars, and name
plates over the nearest tree, in this view or the wood view.

**Several families.** The start screen and `?family=` choose among families,
each with its own album and home person. `make demos` builds the Kennedys,
the Tudors and George Washington's family from genealogy_kg's corpus, with the
living-person filter on, and two fictional families. Only the three historical
families are published.

**Privacy.** Living people show only that their details are withheld, and
tests check that no committed fixture or tracked file carries a living
person's details.

## Upgrading

Nothing to upgrade: this is the first release. A `v*` tag now builds the
orchard and publishes a GitHub Release carrying the build and these notes.

---

_Full changelog: [CHANGELOG.md](CHANGELOG.md)_
