# Troubleshooting

## The tour is silent

Narration is off by default. Open settings and turn on **Read each grove
aloud on the ring**, then start the tour. Silent mode also stops it; turn
**Silent mode** off.

If it is on and you still hear nothing on an iPhone or iPad, check the
device's Silent Mode. iOS mutes the browser's speech when the device is
silenced, even though video in another tab still plays. Open Control Center
and turn Silent Mode off, then reload the page and tap once before starting
the tour.

If narration works on one device and not another, the second device is
usually silenced or has its ringer volume down. Speech follows the ringer
volume, not the media volume.

## "The record could not be fetched"

The record reader loads each person's page from the family's files when you
open it. On the published site this means the download failed; **Try
again** on the message retries it.

In a local checkout the message suggests `make family`: the family's export
is missing or incomplete in `web/public/families/`. Export it again; see
[Privacy and the demo families](privacy.md#showing-your-own-family).

## The orchard does not open, or opens empty

The start screen shows **Growing the orchard** until the family has loaded
and the trees have grown, which takes a few seconds on a phone. If it never
finishes, reload the page. In a local
checkout, run `make demos` or `make family` so that
`web/public/families/` holds at least one family.

## The orchard opens on the wrong family or person

The orchard opens on the family named by `?family=`, then on the one you
picked last on this device. The home tree follows `?focal=` first, then the
person you chose with **Make this the home tree**. Remove the parameters
from the address, or pick the family again from the start screen's
**Family** menu, which drops them. See [Finding people](finding.md).

## A person shows as "Living"

The living-person filter withholds anyone who may be alive, and for the
Kennedys anyone whose record has neither a birth date nor a death record.
This is by design; see [Privacy and the demo families](privacy.md).

## The orchard is slow

In settings:

1. Turn off **Shadows and forest floor detail**.
2. Turn off **Wind and gentle cart motion**.
3. Try **Schematic trees**. It draws no bark or leaves, only beads and
   straight limbs.

**Show geometry and frame rate** tells you what you gained.

## The sky is wrong for where I am

The orchard asked for your location once and you refused, so it placed the
sky by your time zone. To let it use your location, allow the site in the
browser's site settings and reload, or use **Use my location** in About.
The location is rounded to 0.1 degree and never leaves the browser.

## My album is empty again

The album, the visited groves and the settings live in this browser's
storage, and each family has its own album. They are gone if you cleared
the site's data, used a private window, opened the orchard in a different
browser, or pressed **Empty the album**. If you switched families, switch
back: the other family's album is still there.

## The page is blank or shows an error about WebGL

The orchard needs WebGL 2. Every current browser has it, but it can be
turned off by a browser setting, an extension, or a graphics driver problem.
Try another browser; if that works, the first browser's WebGL is disabled.

## Something else

Open an issue at
[github.com/Flux-Frontiers/kpress_family/issues](https://github.com/Flux-Frontiers/kpress_family/issues)
with the browser, the device, and what you did.
