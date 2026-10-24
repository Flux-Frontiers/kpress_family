// Which family the start screen last opened, remembered on this device, and
// switching to another. Switching reloads: the whole orchard regrows.

const FAMILY_CHOICE_KEY = "kpf-family";

/** The family chosen last on this device, or null. */
export function savedFamily(): string | null {
  try {
    return window.localStorage.getItem(FAMILY_CHOICE_KEY);
  } catch {
    return null;
  }
}

/** Open another family: remember it, drop links into this one, and reload. */
export function switchFamily(slug: string): void {
  try {
    window.localStorage.setItem(FAMILY_CHOICE_KEY, slug);
  } catch {
    /* private mode */
  }
  const url = new URL(window.location.href);
  for (const p of ["family", "focal", "tree"]) url.searchParams.delete(p);
  window.location.assign(url.toString());
}
