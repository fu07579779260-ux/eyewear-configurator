# Eyewear Configurator — Plan (draft)

Draft written from the team's proposal "Configurable Modular Eyewear" (copied
in `CONCEPT.md`) and the team's ChatGPT discussion, without an interview. Items marked
**(to confirm)** are my default choices. Please check them.

## 1. Goal

A mobile and web app that lets people design personalised 3D-printed glasses.
They choose how the glasses look and fit, see a live 3D model, and leave with a
saved design and a set of production files for an SLS print in PA12 nylon.

The glasses are modular. A 3D-printed front frame and a pair of 3D-printed
temples are combined with standard off-the-shelf parts: metal hinges, screws
and optical lenses. A standardised screw connection between frame and temples
makes temples swappable, so a user can change temple colour or texture and
keep the frame.

The app shows the full personalisation flow for the workshop:

> choose a frame shape → adjust dimensions → choose colours → pick a temple
> texture → add personal details → preview and confirm → SLS print in PA12 →
> depowder, smooth and dye → assemble hinges, screws and lenses → try on and
> adjust

It is one of three configurable 3D-printed consumer products the team is
documenting. The others are a keycap configurator and a perfume bottle
configurator. This app focuses on how appearance and fit can be personalised
together: style through shape, colour and texture, and fit through dimensions.

## 2. Users

1. **Consumers.** They want glasses that express their style and fit better
   than off-the-shelf frames. This is the main focus, so the app must work well
   on a phone.
2. **Workshop participants.** They design a pair on site and see how choices
   turn into production files. The app must be quick to learn.
3. **Makers / print services and opticians.** They receive the production
   files and a spec sheet, print the parts and fit the lenses.
4. **Design students and designers.** They explore forms and continue in
   Rhino.

## 3. Inputs → Process → Outputs

**Inputs**
- Frame shape (Round, Rounded Square, Cat-Eye)
- Fit dimensions: frame width, bridge size, temple length (advanced: lens
  height, frame front thickness, rim width, temple width)
- Optional measurements from existing glasses: the three numbers printed
  inside most temples (for example `52□18-145`), or measured values
- Colours: frame colour and temple colour, chosen separately
- Temple texture: Smooth, Finely Ribbed, Organically Perforated
- Personal details: initials or a short inscription inside the temples
  (EN / 中文)
- Optional: imported JSON configuration, share link

**Process**
1. Derive the lens width from the frame width, bridge size and rim width, then
   build the 2D lens outline from the shape, lens width and lens height.
2. Build the front frame: offset the outline into a rim, add the lens groove,
   join the two rims with the bridge, and add the end pieces with the hinge
   pockets.
3. Build each temple: sweep a profile along a path with an ear bend, and add
   the matching hinge pocket at the front end.
4. Apply the texture to the outer temple surface only. The hinge zone and the
   ear contact zone stay smooth, and perforations keep a minimum distance from
   the hinge.
5. Engrave the inscription on the inner face of the temples.
6. Check against the SLS PA12 rules (minimum wall, hole size, strut size and
   powder escape) and show warnings.
7. Show a live 3D preview: matte dyed-nylon frame and temples, metal hinges
   and screws, clear lenses. The temples can be folded open and closed.

**Outputs**
- **STL**: one file per printed part (frame, left temple, right temple)
- **3MF**: all printed parts in one file as separate objects, with colours
- **3DM**: Rhino file with named layers per part (plus reference layers for
  the hinges and lenses)
- **Lens outline** (DXF and SVG) for the optician to cut the lenses
- **Spec sheet (PNG + PDF)**: render, dimensions in the `52□18-145` format,
  colours, texture, inscription, print and post-processing notes, design
  number and QR code
- **JSON configuration** and **share link**
- All files bundled as a ZIP (the "set of production files")

## 4. Parameters

Lengths are in millimetres. Every slider has a number input next to it.

### 4.1 Frame shape

| Name | Unit | Range / options | Default |
|---|---|---|---|
| Frame shape | enum | Round, Rounded Square, Cat-Eye (Hexagonal and Bold Frame later) | Rounded Square |
| Corner radius (Rounded Square) | mm | 3 – 15 | 8 |
| Wing lift (Cat-Eye) | mm | 2 – 10 | 5 |

Each shape has a name and a one-line style note, for example "Cat-Eye: a lifted
outer corner with a retro feel".

### 4.2 Fit dimensions

The three main sliders are the ones named in the concept: frame width, bridge
size and temple length.

| Name | Unit | Range / options | Default |
|---|---|---|---|
| Frame width (total front width) | mm | 128 – 156 | 142 (changed in step 7 when the end pieces grew to 7 mm for the hinge pocket) |
| Bridge size | mm | 14 – 24 | 18 |
| Temple length | mm | 130 – 155, step 5 | 145 |
| Lens height (advanced) | mm | 30 – 50 | 40 (per shape) |
| Frame front thickness (advanced) | mm | 4 – 7 | 5 |
| Rim width (advanced) | mm | 3 – 8 | 4.5 |
| Temple width (advanced) | mm | 4 – 10 | 6 |

The lens width (eye size) follows from these values and is shown as a
read-out, together with the standard `lens□bridge-temple` code (for example
`50□18-145`). The app warns if the lens width falls outside 44 – 58 mm.
An **Enter from my glasses** panel accepts the code printed inside most
temples (for example `52□18-145`), three separate numbers, or a measured total
front width, and fills the three main dimensions.

### 4.3 Colours

Colours are a dyed PA12 palette, not free hex values, because the finished
parts are dyed.

| Name | Range / options | Default |
|---|---|---|
| Frame colour | Sage Green, Burgundy, Sand, Navy, Charcoal | Sand |
| Temple colour | same five, or "Same as frame" | Same as frame |

Placeholder swatches (to be matched to dyed samples): Sage Green `#8C9A84`,
Burgundy `#6B2E35`, Sand `#C8B597`, Navy `#2F3A52`, Charcoal `#3A3A3C`.

### 4.4 Temple texture

| Name | Unit | Range / options | Default |
|---|---|---|---|
| Texture | enum | Smooth, Finely Ribbed, Organically Perforated | Smooth |
| Rib pitch / depth (Ribbed) | mm | 0.8 – 2.5 / 0.2 – 0.6 | 1.2 / 0.35 |
| Rib direction (Ribbed) | enum | Along the temple, Across the temple | Across |
| Hole density (Perforated) | – | 0 – 1 | 0.5 |
| Pattern seed (Perforated) | integer | 0 – 9999, plus a "new pattern" button | random |

Fixed keep-smooth zones: the first 15 mm behind the hinge, and the ear contact
zone from the ear bend to the tip **(to confirm)**. Textures go on the outer
face only.

### 4.5 Personal details

| Name | Unit | Range / options | Default |
|---|---|---|---|
| Inscription | string | up to 20 characters per temple (Latin or Chinese) | — |
| Placement | enum | Left temple, Right temple, Both | Left |
| Text size | mm | 2 – 4 | 2.5 |
| Engraving depth | mm | 0.3 – 0.6 | 0.4 |
| Design number | toggle | auto-generated code engraved inside the right temple | on |

### 4.6 Standard parts (fixed, not user-editable)

Confirmed by the user: use these suggested values. Re-measure if the parts we
buy differ.

| Part | Assumption |
|---|---|
| Hinge | Standard 3-barrel screw hinge for plastic frames: two leaves 4.5 × 2.8 × 1.0 mm, barrels Ø 2.2 mm. One leaf sits in a pocket in the back of the end piece, the other in a pocket on the inside of the temple (0.15 mm clearance). The pivot sits in the inside corner, so a folded temple lies flat behind the frame |
| End piece | 7 mm from the rim to the outer end of the frame, room for the frame leaf |
| Screws | M1.4 pivot screw through the barrels; one M1.4 self-tapping screw per leaf, in a Ø 1.15 mm pilot hole |
| Lenses | Standard optical or demo lenses, cut by an optician to the exported outline, held in a groove in the rim |
| Lens groove | 1.2 mm wide, 0.7 mm deep |

## 5. Constraints

**Fit and assembly**
- Hinge pockets and the screw connection are identical on every frame and
  temple, so any temple fits any frame of the same system.
- The lens groove keeps a minimum rim wall around it.
- Nose and ear contact areas are always smooth.
- Final fit is checked on a physical prototype; the app's dimensions are a
  starting point.

**SLS PA12 rules** (placeholders, to be checked with the print service)

| Rule | Value |
|---|---|
| Minimum wall | 0.8 mm (1.2 mm around hinge pockets) |
| Minimum perforation hole | 1.5 mm |
| Minimum strut between holes | 1.2 mm |
| Minimum engraving depth / line width | 0.3 mm / 0.5 mm |
| Clearance for hinge pockets | 0.1 – 0.2 mm |

**Validation**
- Warnings, not hard blocks, with a short reason and a fix suggestion.
- Minimum wall and hole sizes are enforced as slider minimums.

**Platform and data**
- Fully static app: runs locally and on GitHub Pages, no backend.
- Must work in mainland China: no Google Fonts and no external CDNs. All
  fonts (including a Chinese font for engraving) are bundled and lazy-loaded.
- Saved designs stay in the browser (IndexedDB).
- Designed for phones first, and also for desktop.

**Language**
- English and Chinese UI, **English by default**, switchable at any time.

## 6. Tech stack

**Core (fixed; do not change without asking):**
- Vite + React + TypeScript + Tailwind CSS
- UI components: shadcn/ui
- 3D: React Three Fiber + drei
- Rhino export: rhino3dm

**Proposed additions** (same as the perfume project; to confirm when the step
comes up):
- `manifold-3d` (WASM): booleans for hinge pockets, perforations and engraving
- `opentype.js`: glyph outlines for Latin and Chinese engraving
- `jspdf`: spec sheet PDF
- `qrcode`: QR codes for share links
- `jszip`: production-file bundle and 3MF packaging
- `idb-keyval`: IndexedDB storage for saved designs

**Built in-house:**
- Lens outline generators per shape (superellipse and spline based)
- Frame rim, bridge and temple sweep generators
- Seeded noise for the organic perforations
- 3MF writer, DXF/SVG lens outline writer
- EN / 中文 dictionary and language context
- STL export through three.js `STLExporter`

## 7. Pages

Hash routing so that it works on GitHub Pages.

| Route | Page | Purpose |
|---|---|---|
| `#/` | Home | The "printed frame + standard hinges and lenses" idea, the flow, example designs, start button |
| `#/configure` | Configurator | 3D preview beside (desktop) or above (phone) a six-step panel: Shape → Dimensions → Colours → Texture → Personal details → Preview & confirm. Each step has Back / Next and can be reopened at any time. The last step shows a summary, the spec sheet and the exports. |
| `#/inspiration` | Inspiration | Reference cases (e.g. Materialise custom eyewear, the Formlabs SLS eyewear guide) and the team's concept images, each with what it inspired |
| `#/guide` | Making guide | SLS printing, depowdering, smoothing, dyeing, fitting hinges and lenses, swapping temples, try-on and adjustment |
| `#/my-designs` | My designs | Saved designs, reopen / duplicate / delete, and temple swaps on a saved frame |

The header holds the language switch (EN / 中文) and links to all pages.

**Visual style:** warm, calm studio. Warm neutral backgrounds (oat, linen, warm
stone), muted text, and the five dye colours as the only accents. A clean
humanist sans serif, bundled locally (Chinese uses the system sans). The 3D
glasses sit on a soft warm backdrop with diffuse daylight, rendered as matte
dyed nylon with a slight grain, next to brushed metal hinges. It must look
distinct from the keycap app (light technical drawing) and the perfume app
(dark showroom, gold, serif): no black, no gold, no serif headings, and no
blueprint lines.

## 8. Out of scope

- Virtual try-on with the camera (possible future feature)
- Hexagonal and Bold Frame shapes (planned for a later version)
- Face scanning
- Prescription data, lens ordering and optical calculations
- User accounts, login, cloud storage, ordering and payment
- Slicing and sending jobs to printers

## 9. Build order

Each step should run and be checked in the browser (desktop and phone) before
the next one starts.

1. **Scaffold.** Vite + React + TS, Tailwind, shadcn/ui, hash router and
   empty pages. Git init and the GitHub Pages workflow from the perfume
   project. You create the GitHub repo `eyewear-configurator` and switch
   Pages on.
2. **Design tokens and layout.** Warm neutral theme, bundled fonts, app shell,
   navigation, EN / 中文 dictionary (English default), phone layout.
3. **State model.** Typed `EyewearConfig` with defaults and ranges from §4,
   reducer, JSON and share-link (de)serialisation.
4. **3D viewport.** R3F canvas, warm studio lighting, matte nylon and metal
   materials.
5. **Lens outlines.** Round, Rounded Square and Cat-Eye from the dimensions.
6. **Front frame.** Rims, lens groove, bridge, end pieces; clear lenses in
   the preview.
7. **Temples and hinges.** Temple sweep with ear bend, hinge pockets, metal
   hinge and screw models, fold open / closed in the preview.
8. **Six-step configurator.** Step panel with Back / Next for the flow, and
   the "Enter from my glasses" input.
9. **Colours.** Five dye colours for frame and temples separately.
10. **Textures.** Finely Ribbed, then Organically Perforated, with the
    keep-smooth zones and hinge clearance.
11. **Personal details.** Engraved inscription (Latin, then Chinese) and the
    design number.
12. **Validation.** SLS PA12 rules and warnings.
13. **Exports.** STL per part, 3MF, 3DM, lens outline DXF/SVG, spec sheet
    PNG/PDF with QR code, ZIP bundle.
14. **Save and share.** Autosave, My designs page, temple swaps on a saved
    frame, JSON import / export, share link.
15. **Content pages.** Home, Inspiration (with the concept images) and the
    Making guide.
16. **Deploy.** GitHub Pages; check `npm run dev`, the production build, phone
    layout and access from mainland China.
17. **Print validation.** Print one frame and a pair of temples; adjust the
    hinge pocket and groove values and the SLS minimums.

## 10. Decisions

1. Hinges, screws and lenses: use the suggested values in §4.6.
2. GitHub repo: `eyewear-configurator`
   (Pages URL: `fu07579779260-ux.github.io/eyewear-configurator`).
3. The user will add the three concept images to `public/concept/` for the
   Inspiration page.
4. Default ranges and keep-smooth zones: as drafted; adjust after the first
   print.
