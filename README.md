# The Knowledge Press: The Family

The second edition of The Knowledge Press. It reads a
[GenealogyKG](https://github.com/Flux-Frontiers/genealogy_kg) store built
from a GEDCOM file, through two apps:

- a web orchard of family trees, one tree per family line, which you drive
  through in 3-D, and
- an iPhone, iPad and Mac app that answers questions about the family on
  the device.

**Status: Phase 0.** This repository is a copy of
[knowledge_press](https://github.com/Flux-Frontiers/knowledge_press) at the
commit recorded in [PROVENANCE.md](PROVENANCE.md), and it still shows
books. Nothing in it reads family data yet.

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
