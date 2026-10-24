# The Family: the web orchard

A family drawn as an orchard you drive through in the browser. Each family
line (the people born with one surname) is a tree whose limbs run from parent
to child. The lines of a surname stand together in a grove. At the hub, the
home tree is one person's whole family: their descendants are the crown, and
their ancestors are the roots, seen through a glass floor over a lit pit.

## Run it

```bash
make web-install                         # once
make family FAMILY_REPO=../my-family     # a genkg store built with the living filter on
make web-dev                             # http://localhost:5173
```

The orchard reads `public/family/`, written by `genkg export-web`. That
directory is personal data and is never committed. `?focal=<id>` opens on that
person's hourglass. Without it, the app opens on the person chosen with "Make
this the home tree" in the record reader, or else on the person whose
hourglass is fullest. `?tree=<line id>` opens beside a line's tree.

`make web-test` runs the node tests, and `make web-build` typechecks and
builds.

## Where things are (`src/game`)

| File | What it does |
|---|---|
| `familyCatalog.ts` | Types for the export, a kinship index, and the loader |
| `familyTree.ts` | The hourglass layout: home tree and line trees, the kinship graph as wood |
| `familyForest.ts` | Line cards, line trees as the renderer's trees, and the home tree with its pit |
| `forest.ts` | The orchard: groves by surname, the hub, roads, the tour loop |
| `GlassPit.tsx` | The glass floor, the pit under it, and the marriage arcs |
| `schematic.ts`, `SchematicOrchard.tsx` | Schematic mode (V): each person a bead colored by generation, straight limbs, marriage bars, names nearby |
| `FamilyReader.tsx` | The record reader: a line's people, one page each |
| `HUD.tsx` | Cards, search, the line list and the album |
| `growTree.ts` | Pipe-model radii, the bark sweep and the leaves |

The world itself (sky, stars, planets, weather, seasons, roads, the cart, the
guided tour, and the Cosmographium, Double Helix and sundial exhibits) comes
from The Knowledge Press: The Forest; see `../PROVENANCE.md`.

## Stack

React, three.js via React Three Fiber, Zustand and Vite. The tests run on
Node's own test runner (`scripts/test.mjs`), with no browser.
