# Eyewear Configurator · 眼镜配置器

A mobile and web configurator for personalised 3D-printed modular glasses: a
printed PA12 nylon front frame and swappable temples, combined with standard
metal hinges, screws and lenses. One of three configurable 3D-printed products
documented for the team workshop (with the keycap and perfume bottle
configurators).

**Live:** https://fu07579779260-ux.github.io/eyewear-configurator/

- `CONCEPT.md`: the product brief (English and Chinese)
- `PLAN.md`: goal, parameters, constraints and the build order
- `docs/concept/`: the full-size concept images

## What it does

1. **Shape**: round, rounded square or cat-eye, with corner rounding or wing lift.
2. **Dimensions**: frame width, bridge and temple length, or the size code from
   your own glasses (e.g. `52□18-145`); more settings for lens height, frame
   thickness, rim width and temple height.
3. **Colours**: five dye colours, chosen separately for frame and temples.
4. **Texture**: smooth, finely ribbed or organically perforated, on the outside
   of the temples only.
5. **Personal**: initials or an inscription (Latin or Chinese) engraved inside
   the temples, and the design number.
6. **Preview**: summary, save and share, print check (SLS PA12 rules) and the
   production files: STL per part, 3MF, Rhino 3DM, lens outlines (DXF/SVG),
   spec sheet (PDF), design card (PNG) and the design file (JSON), or all of
   them in one ZIP.

The 3D preview shows the printable parts themselves, built with the
manifold-3d geometry kernel, with working hinges (fold the temples). Designs are
autosaved and can be kept in **My designs** (in this browser only, never
uploaded); designs that share a frame can swap temples.

English and Chinese UI, English by default. No fonts or code from other
servers: everything is bundled, so the site also works in mainland China.

## Code

| Folder | What is in it |
|---|---|
| `src/model` | the design: types, ranges, defaults, sizes, reducer, share link, design file |
| `src/geometry` | lens outlines, front frame, temples, hinges, textures, engraving, print checks |
| `src/export` | STL, 3MF, Rhino, DXF/SVG, spec sheet and the ZIP bundle |
| `src/persistence` | autosave and My designs (IndexedDB) |
| `src/components` | layout, step panel, 3D viewport |
| `src/pages`, `src/content` | pages and their texts |
| `src/i18n` | English and Chinese strings |

Tech stack: Vite + React + TypeScript + Tailwind CSS, shadcn/ui, React Three
Fiber + drei, rhino3dm, manifold-3d.

## Run locally

```bash
npm install
npm run dev
```

```bash
npm test
```

## Deploy

Every push to `main` runs the tests, builds the site and publishes it to GitHub
Pages (`.github/workflows/deploy-pages.yml`). One-time setup on GitHub:
Settings → Pages → Source: "GitHub Actions". If a deploy times out on
GitHub's side, pushing again (or re-running the workflow) usually fixes it.
