# Sky, seasons and weather

The orchard's sky, seasons and weather come from The Knowledge Press: The
Forest unchanged.

## The clock

The sky follows a clock with five modes. Tap the clock button in the top bar
(on a phone, **Time of day** in the three-dot menu) to step through them:
Live, Dawn, Day, Dusk, Night, and back to Live.

| Mode | The sky |
| --- | --- |
| Live | Your own time. The sun is where it is now for your place, the moon shows its current phase, and hovering the clock button names the next sunrise or sunset. |
| Dawn, Day, Dusk, Night | Held at that hour. |

At night the stars come out, the lantern lights the road, and lamps light
the signposts, the home tree and the exhibits. Each visit starts on Live; a
mode you pick lasts until you reload.

### Where the sky is placed

The sun, moon and stars are placed for where you are. When you start
driving, the browser asks for your location once; if you allow it, the
orchard uses it, rounded to 0.1 degree and kept only in this browser. If you
refuse, the orchard places the sky by your time zone, at latitude 40
degrees north. **Use my location** in About's Tonight's sky section asks
again. Browsers only offer location on a secure (https) page.

### The stars, planets and moon

The night sky is the real one: the 5,080 stars of the Yale Bright Star
Catalogue, the five naked-eye planets where they are tonight, and the moon
in its true phase. Twilight washes out the faint stars first, and the moon
hides whatever is behind it. Fog and cloud hide the lot. Tilt the view up
with ++up++, or drag it up, to see them. North is the top of the minimap.

### Tonight's sky

**About** (++"?"++, the info button in the top bar, or on a phone the
three-dot menu) has a Tonight's sky section for the real date, whatever the
clock is set to: the moon's phase and the next full and new moon, the meteor
showers active now and coming up, which planets are up tonight, and where to
find Polaris.

### Meteors

Meteors cross the night sky at the rates a dark sky would show tonight: a
few an hour from no shower, and more during one of the major annual
showers, running outward from the shower's radiant. Real rates are slow. To
see more, add `?meteors=` to the address:

- a number multiplies tonight's whole sky, such as `?meteors=10`;
- a shower's name pins that shower to its peak, with an optional multiple
  after a colon, such as `?meteors=geminids:20`.

The names are `quadrantids`, `lyrids`, `eta-aquariids`, `delta-aquariids`,
`perseids`, `draconids`, `orionids`, `leonids`, `geminids` and `ursids`. Set
the clock to Night first.

## Seasons

Each visit opens in the season of today's date for your place; south of the
equator the seasons run half a year on. **Season** in settings picks spring,
summer, autumn or winter until you reload.

| Season | The trees |
| --- | --- |
| Spring | New leaves. |
| Summer | Full canopy. |
| Autumn | Turning leaves, a few already down. |
| Winter | Bare wood: about one leaf in ten stays, so the shape of each line shows. |

## Fog and weather

**Fog** in settings sets the standing haze: clear, light, normal or heavy.

**Random weather**, off by default, adds morning fog that builds, holds and
burns off within a few minutes, and drifting cloud. Fog is far likelier in
the morning, so with the clock on Dawn the chance of a foggy start is best.
While it is on, the setting names the weather now.

To hold the weather for a look or a screenshot, add `?weather=` to the
address with `clear`, `clouds`, `mist`, `fog` or `soup` (dense fog).
