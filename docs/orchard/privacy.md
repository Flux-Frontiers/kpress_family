# Privacy and the demo families

A family-history file holds personal data about living people. The orchard
is built so that a published family never shows them.

## The families on the public site

The public site shows three families, each built from a GEDCOM file in
GenealogyKG's curated corpus of trees already published elsewhere:

| Family | Slug | Home person |
| --- | --- | --- |
| George Washington's Family | `washington` | George Washington |
| The Kennedys | `kennedy` | John Fitzgerald Kennedy |
| The Tudors | `tudors` | Henry Tudor |

The start screen's **Family** menu lists them in this order, and the orchard
opens on the first unless you have picked another on this device or the
address names one with `?family=`. Each is built with GenealogyKG's
living-person filter on, at a cutoff of 100 years:

- Anyone with no death or burial record who was born within the last 100
  years is treated as living.
- For the Kennedys, someone with neither a birth date nor a death record is
  treated as living too.
- The Tudors and George Washington's family are wholly historical files, so
  there a missing birth date is taken as an old record, not a living person.

The filter and its options are documented under
[Living-person privacy](https://flux-frontiers.github.io/genealogy_kg/USAGE/#living-person-privacy)
on the GenealogyKG site.

## What "Living" means in the orchard

A person the filter withholds keeps their place in the family, so the trees
still run through them, and nothing else:

- Their name is "Living", with no dates, places or events.
- Their page in the record reader reads "Living. Details are withheld for
  people who may be alive." It has no record lines and no **Make this the
  home tree** button.
- In schematic mode their bead is gray, and they get no name plate.
- The search field does not match them.
- The orchard never picks a living person as the home tree on its own.

The redaction happens before the orchard sees the data. `genkg export-web`
refuses a store built without the filter, and after writing an export it
scans the files for every withheld name. The web tests check that every
committed test fixture was exported with the filter on and that each living
person in it has no dates, places or page.

## What stays in your browser

The orchard has no accounts and sends nothing about you anywhere. It fetches
the page and the family's files, and keeps the rest in this browser's
storage:

- your settings, shared by every family;
- for each family, your album, the groves you have visited and the home
  person you chose;
- the family you picked last;
- whether you have heard the tour's full welcome;
- your location, if you allowed it, rounded to 0.1 degree and used only to
  place the sky.

Clearing the site's data in the browser removes all of it.

## Showing your own family

You can run the orchard on your own family, on your own machine. Real family
data is never committed to the repository or published from it.

1. Build a GenealogyKG store from your GEDCOM file with the living filter
   on. See [Building a store](https://flux-frontiers.github.io/genealogy_kg/USAGE/#building-a-store)
   and [Living-person privacy](https://flux-frontiers.github.io/genealogy_kg/USAGE/#living-person-privacy).
2. Export it for the orchard with `genkg export-web`. See
   [Exports for The Knowledge Press: The Family](https://flux-frontiers.github.io/genealogy_kg/USAGE/#exports-for-the-knowledge-press-the-family).
3. In a checkout of kpress_family, `make family` runs the export into
   `web/public/families/<slug>/` and adds it to the start screen's list, and
   `make web-dev` serves the orchard at `http://localhost:5173`:

```bash
make web-install
make family FAMILY=mine FAMILY_REPO=../my-family FAMILY_TITLE="My Family"
make web-dev
```

`FAMILY_FOCAL=<id>` names the person the home tree opens on. The
[README](https://github.com/Flux-Frontiers/kpress_family/blob/main/README.md)
covers the other options. `web/public/families/` is ignored by git, so the
export stays on your machine.
