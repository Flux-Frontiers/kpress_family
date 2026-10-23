# Provenance

This repository started as a copy of
[knowledge_press](https://github.com/Flux-Frontiers/knowledge_press)
(The Knowledge Press: The Forest). The two are maintained separately: a
fix made in one is not made in the other unless someone ports it.

## Source

- Repository: `Flux-Frontiers/knowledge_press`
- Commit: `b459cab` ("feat(web): empty the press on its own, not with the
  settings (#74)"), knowledge_press 1.30.0
- Copied: 2026-10-23, with `git archive`, so only tracked files

To see what has drifted since, diff a path against that commit, for
example:

```bash
git -C ../knowledge_press diff b459cab -- web/src/game/growTree.ts
```

## What was copied, and what changed in the copy

| Here | From knowledge_press | Changes |
|---|---|---|
| `web/` | `web/` | package renamed `kpress-family`, version 0.1.0, page title |
| `app/KnowledgePressKit/` | `app/GutenbergKGKit/` | module and test target renamed `KnowledgePressKit`; `AppVersion.fallback` 0.1.0 |
| `app/LICENSE`, `LICENSE`, `TRADEMARK.md`, `.gitignore` | same paths | none |
| `.pre-commit-config.yaml` | same path | dropped the version-site and privacy-manifest hooks, whose scripts were not copied |
| `.github/workflows/ci.yml` | same path | header comment |
| `.github/workflows/web.yml` | same path | test and build only: no book-text download, no user guide, no Pages deploy |
| `.github/workflows/app.yml` | same path | builds and tests the kit only: no Xcode shells to check |
| `Makefile` | `Makefile` | rewritten: web and kit targets only, nothing that publishes |
| `CITATION.cff` | `CITATION.cff` | rewritten for The Family; cites knowledge_press and genealogy_kg |

Not copied: the iOS and macOS shells (`app/ios`, `app/macos`), `docs/`,
`scripts/`, `assets/`, `renders/`, `screenshots/`, the release workflow,
`mkdocs.yml` and the changelog.

## Still pointing at knowledge_press

The copy still shows books, so these are left as they are until the
Family code replaces them:

- `web/src/game/links.ts`: the user guide URL.
- `web/public/privacy.html`, `web/public/support.html`: the App Store
  privacy and support pages.
- `web/README.md`: the forest's own README.
- The book catalog, moots, reader and exhibits under `web/src/` and
  `web/public/`, and `CatalogPack`, `ChapterText` and `CorpusBrowser` in
  the kit.
