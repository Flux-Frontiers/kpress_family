# The Knowledge Press: The Family -- the web orchard (web/) and the
# retrieval kit (app/KnowledgePressKit) for a GenealogyKG family.
#
# Author: Eric G. Suchanek, PhD -- Flux-Frontiers, Liberty TWP, OH
# Copyright (c) 2026 Eric G. Suchanek, PhD. Elastic License 2.0; see LICENSE.
#
# Started as a copy of knowledge_press; see PROVENANCE.md. Nothing here
# publishes, uploads or deploys. genealogy_kg builds the graphs and writes
# the exports; `make demo` only drives it.
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

.PHONY: web-install web-dev web-test web-build web-preview web-kill kit-build kit-test family demos gallery

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
