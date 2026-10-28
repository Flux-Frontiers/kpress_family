# The Knowledge Press: The Family -- the web orchard (web/) and the
# retrieval kit (app/KnowledgePressKit) for a GenealogyKG family.
#
# Author: Eric G. Suchanek, PhD -- Flux-Frontiers, Liberty TWP, OH
# Copyright (c) 2026 Eric G. Suchanek, PhD. Elastic License 2.0; see LICENSE.
#
# Started as a copy of knowledge_press; see PROVENANCE.md. genealogy_kg
# builds the graphs and writes the exports; `make demos` only drives it. The
# one thing that publishes is `make families-publish`, which uploads the
# public demo families (PUBLIC_FAMILIES, never anything else) for the Pages
# build of the orchard.
#
# The web forest (web/):
#   make web-install   -- npm install
#   make web-dev       -- Vite dev server on port 5173
#   make web-test      -- the node test suite
#   make web-build     -- typecheck and production build
#   make web-preview   -- production build, served like web-dev
#   make web-kill      -- stop every running Vite dev or preview server
#   make gallery       -- a portrait of each line tree into renders/lines
#                         (needs make web-dev running and puppeteer-core)
#
# Families (web/public/families/<slug>, never committed):
#   make family FAMILY=<slug> FAMILY_REPO=<dir> [FAMILY_TITLE="..."] [FAMILY_FOCAL=<id>]
#                      -- genkg export-web from a genealogy_kg store built with
#                         the living-person filter on, then refresh the index
#   make demos         -- build the public demo families from genealogy_kg's
#                         corpus into .demo/<slug> (filter on) and export them:
#                         Kennedy, the Tudors and George Washington's family
#   make families-publish -- upload PUBLIC_FAMILIES for the Pages build of the
#                         orchard, then redeploy
#
# The user guide (docs/, mkdocs.yml):
#   make docs-install  -- mkdocs-material into .venv-docs
#   make docs          -- build the guide into site/ (--strict)
#   make docs-serve    -- serve the guide with live reload
#
# The Swift kit (app/KnowledgePressKit):
#   make kit-build     -- swift build
#   make kit-test      -- swift test; set GUTENBERG_PACKS to a built book
#                         corpus to run the corpus suites, which skip without it

KIT_DIR := app/KnowledgePressKit
GENEALOGY_KG_DIR ?= ../genealogy_kg
FAMILY ?=
FAMILY_REPO ?=
FAMILY_TITLE ?= $(FAMILY)
# The person the home tree opens on; empty lets the app pick the fullest hourglass.
FAMILY_FOCAL ?=
FAMILY_CUTOFF ?= 100
# People with no birth date and no death record: "redact" treats them as
# living. "keep" is for wholly historical files, where a missing date means
# an old record, not a living person.
FAMILY_UNKNOWN_BIRTH ?= redact
CORPORA := $(GENEALOGY_KG_DIR)/corpora

.PHONY: web-install web-dev web-test web-build web-preview web-kill kit-build kit-test family demos gallery \
	families-publish docs-install docs docs-serve

web-install:
	cd web && npm install

web-dev:
	cd web && npm run dev

web-test:
	cd web && npm test

web-build:
	cd web && npm run build

web-preview: web-build
	cd web && npm run preview

# Matched by command line, not port: `npm run dev` moves to 5174 when 5173 is
# taken, and a preview server shares 5173. Stops Vite from any checkout.
web-kill:
	@pids=$$(pgrep -f '^([^ ]*/)?node [^ ]*node_modules/(\.bin/vite|vite/bin/vite\.js)( |$$)'); \
	if [ -z "$$pids" ]; then echo "no Vite servers running"; exit 0; fi; \
	ps -o pid=,command= -p "$$(echo $$pids | tr ' ' ',')"; \
	kill $$pids && echo "stopped: $$(echo $$pids)"

kit-build:
	cd $(KIT_DIR) && swift build

kit-test:
	cd $(KIT_DIR) && swift test

# The export refuses a store that was not built with at least this cutoff.
family:
	@test -n "$(FAMILY)" || { echo "set FAMILY to a short name for the family, such as kennedy"; exit 1; }
	@test -n "$(FAMILY_REPO)" || { echo "set FAMILY_REPO to a genkg store directory"; exit 1; }
	cd $(GENEALOGY_KG_DIR) && env -u VIRTUAL_ENV -u POETRY_ACTIVE poetry run genkg export-web \
		--repo $(abspath $(FAMILY_REPO)) --out $(abspath web/public/families/$(FAMILY)) \
		--living-cutoff $(FAMILY_CUTOFF) --unknown-birth $(FAMILY_UNKNOWN_BIRTH) --force
	printf '{"title": "%s", "focal": "%s"}\n' "$(FAMILY_TITLE)" "$(FAMILY_FOCAL)" > web/public/families/$(FAMILY)/about.json
	cd web && node scripts/families.mjs

# One demo family: build its store from a corpus GEDCOM, then export it.
# $(call demo,slug,title,gedcom,unknown-birth policy,home person)
define demo
	mkdir -p .demo/$(1)
	cp "$(3)" .demo/$(1)/family.ged
	printf '[tool.genealogykg]\nliving_cutoff_years = $(FAMILY_CUTOFF)\nunknown_birth_policy = "$(4)"\n' > .demo/$(1)/pyproject.toml
	cd $(GENEALOGY_KG_DIR) && env -u VIRTUAL_ENV -u POETRY_ACTIVE poetry run genkg build \
		--repo $(abspath .demo/$(1)) --source $(abspath .demo/$(1))/family.ged
	$(MAKE) family FAMILY=$(1) FAMILY_REPO=.demo/$(1) FAMILY_TITLE="$(2)" FAMILY_UNKNOWN_BIRTH=$(4) FAMILY_FOCAL=$(5)
endef

demos:
	$(call demo,kennedy,The Kennedys,$(CORPORA)/gedcom-samples/sample-kennedy/kennedy.ged,redact,I104)
	$(call demo,tudors,The Tudors,$(CORPORA)/entries/royalty/english-tudor-royal-family/English+Tudor+Royal+Family.ged,keep,I14)
	$(call demo,washington,George Washington's Family,$(CORPORA)/entries/us-presidents/george-washington-family-big/George+Washington+Family+Big.ged,keep,I1)
	$(call demo,lotr,The Lord of the Rings,$(CORPORA)/entries/fictional-characters/lord-of-the-rings-family-tree/Lord+of+the+Rings+Family+Tree.ged,keep,I0001)
	$(call demo,simpsons,The Simpsons,$(CORPORA)/entries/fictional-characters/simpsons-cartoon-family-tree/Simpsons+Cartoon+Family+Tree.ged,keep,Bart_Simpson)

gallery:
	cd web && node scripts/gallery.mjs

# The Pages build of the orchard reads its families from families.tar.gz on
# the FAMILY_DATA_TAG release, as knowledge_press's reads its book text.
# Only the PUBLIC_FAMILIES are packed, each with an index of just those, so a
# personal family exported beside them in web/public/families never leaves
# this machine. Run `make demos` first so they come from the current
# genealogy_kg. The release stays a draft because Zenodo archives every
# published release; web.yml needs contents: write to read a draft.
PUBLIC_FAMILIES ?= kennedy tudors washington
FAMILY_DATA_TAG ?= family-data
FAMILY_DATA_STAGE := $(patsubst %/,%,$(or $(TMPDIR),/tmp))/kpress-families
FAMILY_DATA_TARBALL := $(patsubst %/,%,$(or $(TMPDIR),/tmp))/families.tar.gz

families-publish:
	rm -rf "$(FAMILY_DATA_STAGE)" && mkdir -p "$(FAMILY_DATA_STAGE)/public/families"
	for f in $(PUBLIC_FAMILIES); do \
	  test -f web/public/families/$$f/catalog.json \
	    || { echo "No export for $$f in web/public/families -- run 'make demos' first."; exit 1; }; \
	  cp -R web/public/families/$$f "$(FAMILY_DATA_STAGE)/public/families/"; \
	done
	cd "$(FAMILY_DATA_STAGE)" && node "$(CURDIR)/web/scripts/families.mjs"
	tar -czf "$(FAMILY_DATA_TARBALL)" -C "$(FAMILY_DATA_STAGE)/public/families" .
	gh release view $(FAMILY_DATA_TAG) >/dev/null 2>&1 \
	  || gh release create $(FAMILY_DATA_TAG) --draft --title "Family data for the web orchard" \
	       --notes "families.tar.gz: the public demo families ($(PUBLIC_FAMILIES)) for the orchard's Pages build, from 'make demos' with the living-person filter on. Kept a draft so Zenodo does not archive it; do not publish."
	gh release upload $(FAMILY_DATA_TAG) "$(FAMILY_DATA_TARBALL)" --clobber
	rm -rf "$(FAMILY_DATA_STAGE)" "$(FAMILY_DATA_TARBALL)"
	gh workflow run web.yml --ref main

# The user guide: docs/*.md rendered by mkdocs-material into site/, as the Web
# workflow renders it into web/dist/docs beside the orchard. --strict fails on
# a broken link, so a bad link stops here rather than on the published site.
DOCS_VENV ?= .venv-docs

docs-install:
	python3 -m venv $(DOCS_VENV) && $(DOCS_VENV)/bin/pip install -q -r docs/requirements.txt

docs:
	$(DOCS_VENV)/bin/mkdocs build --strict

docs-serve:
	$(DOCS_VENV)/bin/mkdocs serve
