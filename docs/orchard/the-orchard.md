# The orchard

The orchard is a picture of one family. Its layout follows from the family's
own kinship: who descends from whom, who married whom, and when each line
began. The numbers below are those the code uses;
[LAYOUT.md](https://github.com/Flux-Frontiers/kpress_family/blob/main/web/LAYOUT.md)
works through them for the three demo families.

## Lines and trees

A line is a surname's chain of descent: the people born with one surname,
joined parent to child. Its founder, the earliest member with no parent in
the line, is the trunk. Every limb runs from a parent to a child, and each
person is a tuft of leaves at their place on the tree. Every limb is as
thick as the family it carries.

- People with no surname in the record join a parent's line, the father
  first.
- A spouse who married in hangs as a twig at the fork on their partner's
  tree, and is also a member of their own line. So a married-in spouse
  stands in two groves.
- A line tree holds every generation of its line, with no cap.

## Groves

A grove is a surname. It holds that surname's lines, packed as close as
their crowns allow; most groves hold one tree. Each surname grows as one
species of tree, named on the grove's signpost.

Each grove has a stop on its ring road: a small paved plaza with the
grove's monogram on it, the surname's initial in script. Beside the stop a
signpost faces the road. It names the surname, counts its trees, and carries
the species plate. Tap a signpost to list the grove's lines.

Groves are seated in order of founding year: the founder's first dated
marriage, or failing that the birth of their eldest dated child. Groves with
no date come last, in alphabetical order. The guided tour meets the groves
in this order, so it runs from the oldest family to the newest.

## Rings and spokes

The groves sit on one or two concentric ring roads around the hub. The
oldest groves are on the inner ring and the rest on the outer one. Four
spokes run straight out from the hub plaza to the outer ring. One of them,
behind the home tree, is the tour's.

The cart is not locked to the roads. You can drive anywhere; the trunks and
the exhibits are solid.

## The home tree

The tree at the hub is the home tree: one person's hourglass. Their
descendants, up to four generations, are the crown. Their ancestors, up to
five generations, are the roots, under a glass floor over a lit pit. You can
drive over the glass and look down at the roots.

The home tree is not one of the line trees. It cuts across the lines, so
everyone on it also stands in their own line's tree out on the rings. The
plaque on the lectern in front of it names the home person and counts the
family's people and lines; tap it, or the tree, to list every line.

Who stands at the hub, in order of choice:

1. The person named by `?focal=` in the address (see
   [Finding people](finding.md)).
2. The person you chose with **Make this the home tree** in the record
   reader (see [Reading the records](reading.md)).
3. The family's own home person, set when the family was exported.
4. Otherwise, the person whose hourglass shows the most family above and
   below ground.

When you drive onto the hub plaza, the hub card shows the home person, the
number of people and lines, and two buttons: **Browse every line** and
**Show ancestors**. **Show ancestors** turns the home tree over: the home
person at the trunk and their ancestors rising as the crown, parents, then
grandparents, doubling as they go. This suits a family like George
Washington's, where the file is his ancestry and his hourglass has nothing
above the ground. **Show the whole family** turns it back. The orchard
regrows each time, which takes a moment.

### The home line

The home person is also marked on their own line's tree. The wood from the
ground up to them is gilded, generation by generation, and a lantern hangs
where they are. Their grove's signpost reads "the home line", the minimap
marks the grove with a gold house, and the tour's card says so at its stop.
Choosing a new home person moves these marks with them.

## Marriages

In god's eye (++c++ until the camera is overhead), thin gold arcs join the
trees of lines that married. Followed inward, they show how the separate
surnames join into one family. From the ground the arcs are not drawn.

## Schematic trees

++v++, or **Schematic trees** in settings, redraws every tree as a family
diagram you can read while driving. The layout stays the same, so nobody
moves.

- Each person is a bead. Its color is their generation counted from the
  tree's trunk person, and its shape is the recorded sex: round for female,
  square for male, a diamond when the record does not say.
- Living people are gray beads with no name.
- Limbs are straight, from parent to child. A marriage is a brass bar
  between the spouses, and the children's limbs leave from the middle of
  the bar.
- Tap a bead to open that person's page in the record reader.

## Name plates

Name plates show the names of the people on the tree nearest the cart,
within 30 m, in either view. This includes the home tree when you are at
the hub. A married-in spouse's plate hangs below their place on the tree,
so a couple's names do not overlap. Living people get no plate. Plates are
not drawn in god's eye, where grove names show instead.

Name plates are on by default. ++n++, or **Name plates** in settings, turns
them off and on.

## Exhibits

Three exhibits from The Knowledge Press: The Forest stand on their own
plazas at the ends of short spurs off the rings: the Mysterium
Cosmographicum (Kepler's nested Platonic solids, 1596), the Double Helix
and the Armillary Sundial. Each has a plaque between the spur and the piece;
tap the plaque to read it full size. The exhibits are gold diamonds on the
minimap and are listed first in the Groves tab.
