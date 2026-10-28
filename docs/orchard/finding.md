# Finding people

These are the ways to reach a person, a line or a grove.

## Search names, places and years

Type in the search field, at the bottom center of the screen on a desktop;
touch layouts move it clear of the stick. It matches each line on its surname and on the names,
birth and death dates and birthplaces of its people. Every word you type must
match the same line, so `boston 1917` finds a line with someone born in
Boston and someone with 1917 in their dates. Living people are not
searched.

As you type:

- The trees that match brighten, and every other tree dims.
- A pin marks each match on the minimap.
- A list of matching lines opens, nearest first, with each line's founders,
  surname and distance. It shows 30; narrow the query for the rest. Pick
  one, or **Jump**, to go to its tree.
- A lantern trail on the ground leads from the cart to the nearest match.
  It goes out when you are standing at it.

Press ++enter++ to jump to the first match. Jumping to a line opens its card
and points the trail and the minimap's pin at it. The clear button in the
field, or an empty field, puts the lanterns out. ++esc++ leaves the field.

## Jump to a grove

++g++, or **Browse** in the top bar and then the **Groves** tab, lists the
three exhibits and every grove with its mark and how many trees it holds.
Groves you have visited are marked. Pick one to jump to its stop.

On the minimap, tap a grove's dot to list its lines, or tap an exhibit's
gold diamond to jump to it. Tapping a grove's signpost in the orchard lists
its lines too.

## Browse every line

++b++, or **Browse** in the top bar, opens the **Lines** tab: every line in
the family, grouped by grove, with each grove's species at the top of its
section and a count of lines and people. Type in the filter to narrow it;
the filter matches the same names, places and years as the search field.
Press ++enter++ to jump to the first line shown, or pick any line to jump to
its tree. Lines already in your album say so.

From a grove's signpost, or a grove's dot on the minimap, the same list
opens showing that grove alone, with **Go to the grove** at the top and a
button back to all the lines.

The home tree and its plaque at the hub open the full list as well, and so
does **Browse every line** on the hub card.

## From the album

The album (++l++) lists the lines you have added. Each entry opens the
line's records or jumps to its grove. See
[Reading the records](reading.md).

## From one person to the next

In the record reader, every parent, child and spouse is a link, and a
relative on another line opens that line. Following the links walks the
family across the groves without driving.

## Links into the orchard

Three parameters in the orchard's address choose what it opens on. They can
be combined.

| Parameter | Opens |
| --- | --- |
| `?family=<slug>` | That family. Otherwise the one you picked last on this device, or the first in the list. |
| `?focal=<id>` | That person's hourglass as the home tree. The id is the person's GEDCOM id, such as `I104`. |
| `?tree=<line id>` | Beside that line's tree, with its card open and the lantern trail pointing at it, instead of at home. |

A family's slug is the name of its folder: `kennedy`, `tudors` or
`washington` on the public site. A line id is the line's surname and its
founder's GEDCOM id, such as `kennedy-I120`; case does not matter. For
example:

```
https://flux-frontiers.github.io/kpress_family/?family=kennedy&tree=kennedy-I120
```

The start screen says which tree a `?tree=` link opens beside. It applies to
**Start driving**; **Guided tour** sets off from home as usual. An id the
family does not have is ignored: an unknown person leaves the usual home
tree, and an unknown line starts you at home.

Picking another family from the start screen's **Family** menu drops all
three parameters and reloads.
