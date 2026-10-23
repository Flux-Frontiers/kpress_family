import type { TreeSite } from "./forest";

/**
 * The tree a `?tree=<line id>` address names, or undefined, e.g.
 * `?tree=kennedy-I120`; case does not matter. An unknown id is ignored so
 * the orchard opens at home as usual.
 */
export function treeFromSearch(search: string, trees: Pick<TreeSite, "line">[]): TreeSite | undefined {
  const slug = new URLSearchParams(search).get("tree")?.trim().toLowerCase();
  if (!slug) return undefined;
  return trees.find((t) => t.line.slug.toLowerCase() === slug) as TreeSite | undefined;
}
