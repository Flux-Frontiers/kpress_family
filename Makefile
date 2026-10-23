# The Knowledge Press: The Family -- the web orchard (web/) and the
# retrieval kit (app/KnowledgePressKit) for a GenealogyKG family.
#
# Author: Eric G. Suchanek, PhD -- Flux-Frontiers, Liberty TWP, OH
# Copyright (c) 2026 Eric G. Suchanek, PhD. Elastic License 2.0; see LICENSE.
#
# Phase 0: a copy of knowledge_press at the commit in PROVENANCE.md, still
# showing books. Nothing here publishes, uploads or deploys, and nothing
# here builds a graph: genealogy_kg does that.
#
# The web forest (web/):
#   make web-install   -- npm install
#   make web-dev       -- Vite dev server on port 5173
#   make web-test      -- the node test suite
#   make web-build     -- typecheck and production build
#   make web-preview   -- production build, served like web-dev
#   make web-kill      -- stop every running Vite dev or preview server
#
# The Swift kit (app/KnowledgePressKit):
#   make kit-build     -- swift build
#   make kit-test      -- swift test; set GUTENBERG_PACKS to a built book
#                         corpus to run the corpus suites, which skip without it

KIT_DIR := app/KnowledgePressKit

.PHONY: web-install web-dev web-test web-build web-preview web-kill kit-build kit-test

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
