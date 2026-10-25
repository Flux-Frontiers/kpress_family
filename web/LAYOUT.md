# The layout of the orchard

How a family becomes an orchard: what stands at the hub, what a grove is,
what is on each ring, where the spokes run, and where the tour goes. The
numbers are the ones in `src/game/forest.ts` and `src/game/math.ts`; the
examples are the three demo families built by `make demos`.

## In one picture

```
                 outer ring (tier 2 groves outside it)
            .  .  .  .  .  .  .  .  .  .  .  .  .
         .            inner ring (tier 1)           .
      .          .  .  .  .  .  .  .  .  .            .
    .         .                            .            .
   .        .          +----------+          .           .
   .       .           |  hub     |           .          .
   .       .    spoke  |  plaza   |  spoke     .         .
   .       .  ---------|  o pit o |---------   .         .
   .       .           |  home    |           .          .
   .        .          +----------+          .           .
    .         .             |              .            .
      .          .  .  .  . | .  .  .  .              .
         .                  | tour spoke            .
            .  .  .  .  .  .|.  .  .  .  .  .  .  .
                            |
                   (an exhibit on a spur off a ring)
```

Four spokes leave the hub plaza and run straight out to the outer ring. One
of them, behind the home tree, is the tour's. Each grove has a stop on its
ring and a signpost beside the stop; the grove itself stands just outside
the ring. Three exhibits stand at the ends of short spurs off the rings.

## The hub

The center of the orchard is the home tree: one person's hourglass, their
descendants as the crown and their ancestors as roots under a glass floor
over a lit pit. The person is the family's `focal` (set with
`FAMILY_FOCAL`, chosen in the reader with "Make this the home tree", or
`?focal=<id>`); without one, the fullest hourglass in the family.

- The pit's radius is the roots' reach plus a margin, never under 4 m. The
  glass floor covers it; the cart drives over the glass.
- The hub plaza is paved out to the pit's edge plus 2 m, never under 10 m.
  The lectern with the family's plaque stands on it, and the cart starts
  11.5 m out along the plaque's bearing, facing the hub.
- The inner ring keeps clear of the hub: at least 18 m from the center, at
  least 8 m outside the plaza, and at least 6 m beyond the crown's reach.

| Family | Home | Pit radius | Plaza radius |
| --- | --- | ---: | ---: |
| The Kennedys | John Fitzgerald Kennedy | 11.5 m | 13.5 m |
| The Tudors | Henry Tudor | 9.5 m | 11.5 m |
| George Washington's family | George Washington | 11.2 m | 13.2 m |

"Show ancestors" on the hub card turns the home tree over: the focal person
at the trunk and their ancestors rising as the crown, for a family like
George Washington's, where the file is his ancestry and his hourglass has
nothing above the ground.

## Groves

A grove is a surname. Every person belongs to exactly one line, every line
is one tree, and a grove holds the surname's lines. Most groves hold one
tree: 43 of the Kennedys' 45 do.

A line is a surname's chain of descent. The export (`genkg export-web`)
links each parent and child who share a surname; each connected group is a
line, and its founder, the earliest member with no parent in the group, is
the trunk. People with no surname in the record join a parent's line,
father first. A married-in spouse is a twig on their partner's line tree
and a member of their own line, so they stand in two groves.

The ring trees are not the home tree's descendants. The rings hold the
whole family, partitioned by surname; the home tree is a second view that
cuts across the lines, one person's ancestors and descendants, and everyone
on it also stands in their own line out on the rings. John Fitzgerald
Kennedy is on the hub hourglass and in the Kennedy grove's tree under its
founder of 1823; Rose Fitzgerald is on the hourglass and in the Fitzgerald
tree.

George Washington's family shows the difference most clearly, because the
file is his ancestry and he has no children on record. The Washington
grove is the surname's chain of descent from its founder, Robert
Washington, born 1404 (the line's founding year, his first dated marriage
or eldest child, is 1430), 70 people over three centuries, and George, born
1732, is at the tip of one limb, the last Washington in the file. The Ball
grove is the same for his mother's surname, 56 people from William Ball,
born 1450, with Mary Ball at a tip; she is also a twig on the
Washington tree, married to Augustine. Every other grove is another strand
of the same pedigree, an ancestress's surname traced back through her
fathers to the earliest person of that name the file knows, and a lone 5 m
tree is a woman whose own parents it does not record. The groves are the
roots of George's hourglass pulled apart and planted by surname, each with
its founder at the trunk and its latest member at a tip; the gold arcs in
god's eye are the marriages that join strand to strand, and followed inward
they all end at George. The hub shows the same people joined: his hourglass
has roots and no crown, since the crown would be his own descendants, and
"Show ancestors" raises the roots as one crown with George at the trunk.

- The trees in a grove are packed as close as their crowns allow, no nearer
  than 6.5 m between trunks; a lone tree stands at the grove's center.
- The grove's radius is its widest crown's reach plus 3 m, never under 5 m.
  The Kennedy grove is 12.9 m, the Bouvier grove 14.8 m, and a one-person
  line is 5 m.
- Groves keep at least 4 m of clear ground between them.

Groves are ordered by founding year: the founder's first dated marriage, or
failing that the eldest child's dated birth. Undated groves come last, in
alphabetical order. This order is the order they are seated on the wheel,
and so the order the tour meets them.

| Family | Oldest grove | Then | Undated |
| --- | --- | --- | ---: |
| The Kennedys | Mercier, 1740 | Bouvier 1753, Repelin 1753, Fitzgerald 1798, Murphy 1821, Kennedy 1823 | 11 of 45 |
| The Tudors | Beaufort, 1443 | Grey 1455, Tudor 1455, Stanley 1457, Plantagenet 1464, Neville 1466 | 62 of 95 |
| George Washington's family | De Creft, 1385 | De Washington 1385, Mortimer 1390, Percy 1390, Grey 1392, Poynings 1392 | 7 of 88 |

The Tudors' count of undated groves is high because most of their lines are
married-in spouses with no dated marriage or children in the file.

## Rings and tiers

Groves sit on one or two concentric ring roads around the hub, in order
round each ring. The wheel tries every split (the first k groves on an
inner ring, the rest on an outer one, and k = 0 for a single ring) and
keeps the one with the smallest world.

- A grove's inner edge is 1.4 m outside its ring; its stop is on the ring at
  the grove's bearing.
- Each ring is the least radius that seats its groves with their 4 m gaps,
  then the spare angle is shared evenly between the gaps.
- The outer ring clears the inner tier's widest grove, so the two tiers never
  touch.

| Family | Groves | Ring 1 | Ring 2 | World radius |
| --- | ---: | --- | --- | ---: |
| The Kennedys | 45 | 34.4 m, 15 groves | 66.9 m, 30 groves | 108 m |
| The Tudors | 95 | 107.4 m, 32 groves | 145.5 m, 63 groves | 189 m |
| George Washington's family | 88 | 98.9 m, 31 groves | 138.9 m, 57 groves | 190 m |

The inner ring holds the oldest groves: on the Kennedys', Mercier, Bouvier,
Repelin, Fitzgerald, Murphy and Kennedy are the first six of fifteen; on the
Tudors', Beaufort, Grey, Tudor, Stanley, Plantagenet and Neville. The outer
ring holds the rest, the undated ones last.

The world radius is the outermost grove's far edge, grown if an exhibit
stands farther out. The Kennedys' orchard fits in a 108 m circle; the two
historical families need about 190 m.

## Spokes

Four spokes run from the hub plaza (1 m inside its edge) straight out to the
outer ring. They are reserved while the inner tier is seated: each spoke is
a lane with no width, seated between two groves like a grove of its own, so
the groves keep 4 m from it on either side.

- The first lane goes before the first grove. It is the tour's spoke, and
  the wheel is turned so it runs out behind the home tree: the drive starts
  on the road.
- The other three go before whichever grove stands nearest a quarter, a half
  and three quarters of the way round, judged by seating the tier once
  without lanes.

A lane can only fall between two groves, so the spokes are as even as the
groves allow. On the Kennedys' wheel the four are 87, 102, 92 and 79
degrees apart.

Where a spoke crosses a ring, the four corners are rounded by curbs of
2 m radius, so the roads read as one road bending and the tour cart's
rounded turns keep their wheels on the brick. At the outer ring the spoke
ends in a T, and only its two inside corners are rounded. Signposts keep
5 m from a crossing, clear of its curbs.

## Stops, signposts and monograms

Each grove has a stop on its ring: a paved plaza 3.2 m in radius with the
grove's monogram on it, the surname's initial in script, white on an ink
disc in a band of the grove's color, its top toward the grove.

The signpost stands 4.7 m or more from the stop, as near the grove's
bearing as it can while keeping 2.6 m from every road and clear of every
trunk, and faces the stop. It names the surname, counts its trees, and
carries the species plate. Its face has a texture only within 70 m of the
cart; farther, it is plain paper.

## Exhibits

Three exhibits from The Forest stay: the Mysterium Cosmographicum, the
Double Helix and the Armillary Sundial. Each stands on its own plaza at the
end of a spur off a ring, with a plaque between the spur and the piece.
Spurs leave a ring clear of the stops and 12 m from any junction, and the
exhibits may stand up to 30 m beyond the outermost groves. Each in turn
takes the spur farthest round the rings from the ones already placed, so
the three are spread about the orchard: on the Kennedys', at 50 to 52 m
from the hub.

## The tour

"Ride the ring" drives the loop: out along the tour spoke to the inner
ring, once round it counterclockwise, out along the same spoke to the next
ring, once round that, and back in along the spoke to the hub. Every stop
is a sample of the loop, so the cart pulls into each plaza, faces the
signpost, and the grove's card and narration come up. Because the groves
are seated in founding order, the tour meets the Kennedys from Mercier
(1740) to the last undated grove, Wilmouth, and ends at the home tree.

The album's ranks follow the lines you add to it, at any stop or from the
reader: Reader, Clerk, Registrar, Archivist, and Keeper of the Line for
every line in the family.

## What grows with the family

| Quantity | Grows with |
| --- | --- |
| World radius | The sum of grove widths: the groves on the rings |
| Trees and leaves | The people (about 1 MB of geometry for 529 people) |
| Signpost textures | The dozen or so signs within 70 m of the cart, not the family |
| Monograms | One texture, however many groves |
| Name plates | The people of the nearest tree, within 30 m |

So a family twice as large needs a ring about twice as long, not a world
twice as wide, and costs the same in memory while you are in one place.
