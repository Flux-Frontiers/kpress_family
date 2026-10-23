# The Knowledge Press: The Family

The second edition of The Knowledge Press. It reads a
[GenealogyKG](https://github.com/Flux-Frontiers/genealogy_kg) store built
from a GEDCOM file, through two apps:

- a web orchard of family trees, one tree per family line, which you drive
  through in 3-D, and
- an iPhone, iPad and Mac app that answers questions about the family on
  the device.

**Status: Phase 3, in progress.** The orchard grows from a family: one
grove per surname, one tree per family line, and the home tree at the hub, a
full hourglass whose roots (the focal person's ancestors) are seen through a
glass floor over a lit pit. Every tree's wood is the kinship graph itself.
The HUD, search and tour still speak in books; they are rewritten next.
The repository started as a copy of
[knowledge_press](https://github.com/Flux-Frontiers/knowledge_press); see
[PROVENANCE.md](PROVENANCE.md).

## A family to show

The orchard reads `web/public/family/`, written by `genkg export-web` from a
[genealogy_kg](https://github.com/Flux-Frontiers/genealogy_kg) store. That
directory is personal data and is never committed:

```bash
make family FAMILY_REPO=../my-family    # a genkg store built with the living filter on
make web-dev
```

`?focal=<id>` opens on that person's hourglass; otherwise the app picks the
person whose hourglass is fullest.

## Build and test

Needs Node 22 and Swift 6.

```bash
make web-install   # once
make web-test      # node test suite
make web-build     # typecheck and production build
make web-dev       # dev server on port 5173
make kit-test      # Swift kit tests
```

`make kit-test` skips the corpus suites unless `GUTENBERG_PACKS` names a
built GutenbergKG corpus.

## Privacy

A GEDCOM holds personal data about living people. Real family data is never
committed to this repository or published from it. Demos and screenshots
use public corpora only.

## License

`web/` is under the Elastic License 2.0 ([LICENSE](LICENSE)). `app/` is
proprietary ([app/LICENSE](app/LICENSE)). Names and artwork are covered by
[TRADEMARK.md](TRADEMARK.md).
