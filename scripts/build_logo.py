#!/usr/bin/env python3
"""Draw the The Family logo in Art Techno and write every size the repo uses.

The mark is the drop line: two spouses, a drop line and their children,
the chart from The Family's own logo, routed as traces. It is the fleet
mark only; the logo, app icon and seal stay as they are. The palette, drawing helpers and outlined lettering come from the
Art Techno brand build, so the SVGs render the same everywhere.

Usage::

    python scripts/build_logo.py

Needs ``fonttools``, Google Chrome for the PNG renders, and a clone
of https://github.com/Flux-Frontiers/art_techno beside this repo. Set ``CHROME``
to the browser binary if it is not at the default macOS path.

Writes:

- ``assets/kpressfamily_logo.svg`` and ``assets/kpressfamily_logo.png``: the square
  mark (1024 px PNG)
- ``assets/kpressfamily_icon.svg``: the mark reduced for 64 px and below
- ``assets/kpressfamily_banner.svg`` and ``assets/kpressfamily_banner.png``
"""

import importlib.util
import math
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AT_BUILD = ROOT.parent / "art_techno" / "docs" / "brand" / "build.py"

_spec = importlib.util.spec_from_file_location("at_build", AT_BUILD)
at = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(at)

f, line, pad, via, diamond, clipped_rect = (
    at.f,
    at.line,
    at.pad,
    at.via,
    at.diamond,
    at.clipped_rect,
)
OBSIDIAN, PANEL, COPPER, GOLD, GREEN, MINT, SILK = (
    at.OBSIDIAN,
    at.PANEL,
    at.COPPER,
    at.GOLD,
    at.GREEN,
    at.MINT,
    at.SILK,
)

NAME = "THE FAMILY"
PART = "SURNAMES . LINES . PEOPLE"


def rect(
    x: float,
    y: float,
    w: float,
    h: float,
    fill: str,
    stroke: str = "",
    width: float = 0,
) -> str:
    s = f' stroke="{stroke}" stroke-width="{f(width)}"' if stroke else ""
    return (
        f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" fill="{fill}"{s}/>'
    )


def die(x: float, y: float, s: float, core: str) -> str:
    """A square green die in a gold line, centered on ``x, y``.

    :param x: Center x.
    :param y: Center y.
    :param s: Side length.
    :param core: Color of the square at its center.
    """
    return rect(x - s / 2, y - s / 2, s, s, GREEN, GOLD, s / 9) + rect(
        x - s / 6, y - s / 6, s / 3, s / 3, core
    )


def arc(
    cx: float, cy: float, r: float, a0: float, a1: float, color: str, width: float
) -> str:
    """A true circular arc about ``cx, cy`` from angle ``a0`` to ``a1``.

    :param cx: Center x.
    :param cy: Center y.
    :param r: Radius.
    :param a0: Start angle in degrees, measured clockwise from +x (y points down).
    :param a1: End angle in degrees.
    :param color: Stroke color.
    :param width: Stroke width.
    """
    x0, y0 = cx + r * math.cos(math.radians(a0)), cy + r * math.sin(math.radians(a0))
    x1, y1 = cx + r * math.cos(math.radians(a1)), cy + r * math.sin(math.radians(a1))
    sweep = 1 if a1 > a0 else 0
    return (
        f'<path d="M{f(x0)} {f(y0)}A{f(r)} {f(r)} 0 0 {sweep} {f(x1)} {f(y1)}" fill="none" '
        f'stroke="{color}" stroke-width="{f(width)}"/>'
    )


def node(x: float, y: float, r: float) -> str:
    """A trace end: a gold pad with a green core."""
    return pad(x, y, r, GOLD) + pad(x, y, r * 0.44, GREEN)


def ring(
    cx: float,
    cy: float,
    r: float,
    color: str,
    width: float,
    opacity: float = 1.0,
    fill: str = "none",
) -> str:
    """A true circle in a stroke, optionally filled.

    :param cx: Center x.
    :param cy: Center y.
    :param r: Radius.
    :param color: Stroke color.
    :param width: Stroke width.
    :param opacity: Stroke opacity.
    :param fill: Fill color.
    """
    o = f' stroke-opacity="{opacity}"' if opacity < 1 else ""
    return (
        f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" fill="{fill}" stroke="{color}" '
        f'stroke-width="{f(width)}"{o}/>'
    )


def leaf(x: float, y: float, r: float, color: str) -> str:
    """A leaf: a pad in its season's color with a dark core."""
    return pad(x, y, r, color) + pad(x, y, r * 0.38, OBSIDIAN)


def drop_line(display=None) -> str:
    """The drop line on a 512 field: the chart a genealogist draws, routed as traces.

    Two spouses are dies joined by a double bar with a jade diamond at its
    middle; a drop line falls to a sibling bus and three children; the middle
    child's line goes on to a pad.
    """
    out = [
        line([(168, 130), (344, 130)], GOLD, 5)
        + line([(168, 144), (344, 144)], GOLD, 1.6)
    ]
    out.append(line([(256, 137), (256, 216)], GOLD, 5))
    out.append(line([(120, 216), (392, 216)], COPPER, 4))
    kids = ((120, COPPER), (256, GOLD), (392, COPPER))
    for x, color in kids:
        out.append(line([(x, 216), (x, 276)], color, 4))
    out.append(line([(256, 276), (256, 330)], GOLD, 3) + pad(256, 334, 7, GOLD))
    for x, color in kids:
        out.append(leaf(x, 276, 14, color))
    out.append(die(168, 137, 46, SILK) + die(344, 137, 46, SILK))
    out.append(diamond(256, 137, 9, GREEN))
    return "".join(out)


def drop_line_small() -> str:
    """The drop line reduced for 64 px and below: two spouses, the drop, three children."""
    out = [line([(18, 18), (46, 18)], GOLD, 2.4), line([(32, 18), (32, 34)], GOLD, 2.4)]
    out.append(line([(12, 34), (52, 34)], COPPER, 2.2))
    for x in (12, 32, 52):
        out.append(
            line([(x, 34), (x, 46)], COPPER, 2.2)
            + pad(x, 47, 3.8, COPPER if x != 32 else GOLD)
        )
    out.append(die(16, 18, 10, GOLD) + die(48, 18, 10, GOLD))
    return "".join(out)


def border(w: float, h: float, inset: float, c: float, heavy: float) -> str:
    """Double frame with 45-degree corners and a green diamond at each corner.

    :param w: Canvas width.
    :param h: Canvas height.
    :param inset: Distance of the heavy line from the canvas edge.
    :param c: Corner cut of the heavy line.
    :param heavy: Stroke width of the heavy line.
    """
    out = [
        f'<path d="{clipped_rect(inset, inset, w - 2 * inset, h - 2 * inset, c)}" fill="none" stroke="{GOLD}" stroke-width="{f(heavy)}"/>',
        f'<path d="{clipped_rect(inset * 1.9, inset * 1.9, w - 3.8 * inset, h - 3.8 * inset, c * 0.75)}" fill="none" stroke="{GOLD}" stroke-width="{f(heavy * 0.4)}" stroke-opacity=".6"/>',
    ]
    d = inset * 1.45 + c * 0.4375
    for cx, cy in ((d, d), (w - d, d), (d, h - d), (w - d, h - d)):
        out.append(diamond(cx, cy, inset * 0.5, GREEN))
    return "".join(out)


def svg(w: int, h: int, title: str, body: str) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
        f"<title>{title}</title>"
        f'<rect width="{w}" height="{h}" fill="{OBSIDIAN}"/>{body}</svg>\n'
    )


def mark(display, mono) -> str:
    """512 square mark: the drop line, the name and the part line beneath."""
    body = border(512, 512, 10, 26, 5) + drop_line()
    size = min(40, 40 * 400 / display.width(NAME, 40, 0.2))
    body += display.path(NAME, 256, 430, size, 0.2, "middle", GOLD)
    body += mono.path(PART, 256, 462, 13.5, 0.3, "middle", MINT)
    return svg(512, 512, "The Family mark, Art Techno", body)


def icon() -> str:
    """64 icon: the reduced drop line in one heavy frame, no lettering."""
    body = f'<path d="{clipped_rect(2.5, 2.5, 59, 59, 7.5)}" fill="none" stroke="{GOLD}" stroke-width="3"/>'
    return svg(64, 64, "The Family icon, Art Techno", body + drop_line_small())


def banner(display, mono) -> str:
    """1280 x 320 banner: the drop line left, the name and part line right.

    The name is set as large as the room right of the drop line allows, and the
    pair is centered on the banner's height.
    """
    s = 0.78
    body = border(1280, 320, 10, 18, 3)
    body += f'<g transform="translate({f(230 - 256 * s)} {f(160 - 210 * s)}) scale({s})">{drop_line()}</g>'
    cx, room, gap = 820, 760, 34
    size = min(120, 120 * room / display.width(NAME, 120, 0.2))
    part = min(26, 26 * room / mono.width(PART, 26, 0.3))
    cap = display.cap * size / display.upm
    pcap = mono.cap * part / mono.upm
    base = (320 - (cap + gap + pcap)) / 2 + cap
    body += display.path(NAME, cx, base, size, 0.2, "middle", GOLD)
    body += mono.path(PART, cx, base + gap + pcap, part, 0.3, "middle", MINT)
    return svg(1280, 320, "The Family banner, Art Techno", body)


def render(src: Path, out: Path, w: int, h: int) -> None:
    """Render the SVG ``src`` to ``out`` at ``w`` x ``h`` px with headless Chrome.

    :param src: SVG file; its ``width`` attribute sets the CSS width.
    :param out: PNG to write.
    :param w: Output width in px.
    :param h: Output height in px.
    """
    svg_w = int(src.read_text().split('width="', 1)[1].split('"', 1)[0])
    subprocess.run(
        [
            at.CHROME,
            "--headless",
            "--disable-gpu",
            "--hide-scrollbars",
            f"--window-size={svg_w},{svg_w * h // w}",
            f"--force-device-scale-factor={w / svg_w}",
            f"--screenshot={out}",
            src.as_uri(),
        ],
        check=True,
        capture_output=True,
    )


def main() -> None:
    at.fetch_fonts()
    display = at.Face(at.CACHE / "JosefinSans.ttf", weight=600)
    mono = at.Face(at.CACHE / "IBMPlexMono-Medium.ttf")

    assets = ROOT / "assets"
    assets.mkdir(exist_ok=True)
    mark_svg = assets / "kpressfamily_logo.svg"
    icon_svg = assets / "kpressfamily_icon.svg"
    banner_svg = assets / "kpressfamily_banner.svg"
    mark_svg.write_text(mark(display, mono))
    icon_svg.write_text(icon())
    banner_svg.write_text(banner(display, mono))

    render(mark_svg, mark_svg.with_suffix(".png"), 1024, 1024)
    render(banner_svg, banner_svg.with_suffix(".png"), 2560, 640)


if __name__ == "__main__":
    main()
