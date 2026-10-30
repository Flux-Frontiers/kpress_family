[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/Flux-Frontiers/kpress_family/releases)
[![License: Elastic-2.0](https://img.shields.io/badge/License-Elastic%202.0%20%7C%20app%20proprietary-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-22-blue.svg)](https://nodejs.org/)
[![Swift](https://img.shields.io/badge/swift-6-blue.svg)](https://www.swift.org/)
[![Data: GenealogyKG](https://img.shields.io/badge/data-GenealogyKG-blue.svg)](https://github.com/Flux-Frontiers/genealogy_kg)
[![CI](https://github.com/Flux-Frontiers/kpress_family/actions/workflows/ci.yml/badge.svg)](https://github.com/Flux-Frontiers/kpress_family/actions/workflows/ci.yml)
[![Web](https://github.com/Flux-Frontiers/kpress_family/actions/workflows/web.yml/badge.svg)](https://github.com/Flux-Frontiers/kpress_family/actions/workflows/web.yml)
[![App](https://github.com/Flux-Frontiers/kpress_family/actions/workflows/app.yml/badge.svg)](https://github.com/Flux-Frontiers/kpress_family/actions/workflows/app.yml)
[![DOI](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.23765496-blue.svg)](https://doi.org/10.5281/zenodo.23765496)

<img src="./logo.svg" alt="The Family logo" width="600">

# The Knowledge Press: The Family

The second volume of The Knowledge Press. It reads a
[GenealogyKG](https://github.com/Flux-Frontiers/genealogy_kg) store built
from a GEDCOM file, through two apps:

- a web orchard of family trees, one tree per family line, which you drive
  through in 3-D, and
- an iPhone, iPad and Mac app that answers questions about the family on
  the device. The apps are in development and not yet available.

*Author: Eric G. Suchanek, PhD -- Flux-Frontiers, Liberty TWP, OH*

**Open the orchard:** https://flux-frontiers.github.io/kpress_family/

**User guide:** https://flux-frontiers.github.io/kpress_family/docs/

One grove stands for each surname and one tree for each family line, and
every tree's wood is the kinship graph itself. The home tree at the hub is a
full hourglass: the focal person's descendants are the crown, and their
ancestors are the roots, seen through a glass floor over a lit pit. Drive up
to a tree to read its line's records, add lines to your album, search names,
places and years, or ride the guided tour, which visits the groves in the
order their families began. The published orchard shows three public
families.

The repository started as a copy of
[knowledge_press](https://github.com/Flux-Frontiers/knowledge_press); see
[PROVENANCE.md](PROVENANCE.md).

## Families to show

The orchard reads families from `web/public/families/<slug>/`, each written
by `genkg export-web` from a
[genealogy_kg](https://github.com/Flux-Frontiers/genealogy_kg) store, with an
index the start screen offers a choice from. That directory is personal data
and is never committed:

```bash
make demos                       # the Kennedys, the Tudors, George Washington's family, two fictional ones
make family FAMILY=mine FAMILY_REPO=../my-family FAMILY_TITLE="My Family"
make web-dev
make families-publish            # upload the public demos for the Pages build, then redeploy
```

`make demos` builds five public files from genealogy_kg's local corpus into
`.demo/<slug>` (the Kennedys, the Tudors, George Washington's family, the Lord
of the Rings and the Simpsons), with the living filter on, and exports them.
`make family` adds any genkg store built with the filter on;
`FAMILY_FOCAL=<id>` names the person its home tree opens on, and
`FAMILY_UNKNOWN_BIRTH=keep` is for wholly historical files, where a missing
birth date means an old record rather than a living person.

`?family=<slug>` opens that family; otherwise the one chosen last on this
device, or the first. Each family keeps its own album, groves visited and home
person. `?focal=<id>` opens on that person's hourglass. Otherwise the home
tree is the person chosen with "Make this the home tree" in the record reader,
then the family's own, or else the person whose hourglass is fullest.
`?tree=<line id>` opens beside a line's tree.

## Build and test

Needs Node 22 and Swift 6.

```bash
make web-install   # once
make web-test      # node test suite
make web-build     # typecheck and production build
make web-dev       # dev server on port 5173; __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=<your-mac>.local for a phone or iPad
make kit-test      # Swift kit tests
make gallery       # a portrait of each line tree into renders/lines (needs web-dev)
```

`make kit-test` skips the corpus suites unless `GUTENBERG_PACKS` names a
built GutenbergKG corpus.

## Privacy

A GEDCOM holds personal data about living people. Real family data is never
committed to this repository or published from it. A local `web/dist/` holds
whatever families were exported on this machine, so it is not for publishing.
The published orchard is built in CI from the `family-data` release, which
`make families-publish` fills with the `PUBLIC_FAMILIES` only (the Kennedys,
the Tudors and George Washington's family, from genealogy_kg's public corpus
with the living filter on); a personal family exported beside them is never
packed. Demos and screenshots use public corpora only.

`genkg export-web` refuses a store built without the living filter, and
after writing it scans the export for every redacted name. The web tests
check what this repository can: every committed fixture was exported with
the filter on, each living person in it is a name of "Living" with no
dates, places or page, and git tracks no export, GEDCOM or pack.

## Citation

If you use The Family in your research or project, please cite it:

> Suchanek, E. G. (2026). *The Knowledge Press: The Family* (Version 0.1.0) [Software]. Flux-Frontiers. https://doi.org/10.5281/zenodo.23765496

```bibtex
@software{suchanek_kpress_family,
  author    = {Suchanek, Eric G.},
  title     = {The {Knowledge Press}: The Family},
  version   = {0.1.0},
  year      = {2026},
  publisher = {Flux-Frontiers},
  doi       = {10.5281/zenodo.23765496},
  url       = {https://github.com/Flux-Frontiers/kpress_family},
}
```

The same metadata is in [`CITATION.cff`](CITATION.cff). The kinship graph
the orchard grows is GenealogyKG's; please cite it too:

> Suchanek, E. G. (2026). GenealogyKG: Genealogical Knowledge Graph (Version 0.5.0) [Software]. Flux-Frontiers. https://doi.org/10.5281/zenodo.22182369

## License

`web/` is under the Elastic License 2.0 ([LICENSE](LICENSE)). `app/` is
proprietary ([app/LICENSE](app/LICENSE)). Names and artwork are covered by
[TRADEMARK.md](TRADEMARK.md).
