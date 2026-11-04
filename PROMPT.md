I want to build a web app: a configurator for 3D-printable modular eyewear.

Context: this is one of three configurable 3D-printed consumer products our
team is documenting for a short design workshop (the other two are a keycap
configurator and a perfume bottle configurator). The eyewear configurator
focuses on how frame shape, fit dimensions, colour and temple surface let a
person get glasses that fit their face and express their style, while the
optical and mechanical parts stay standard.

The product is a 3D-printed front frame and a pair of interchangeable
3D-printed temples, combined with standard off-the-shelf parts: metal hinges,
screws and optical lenses. A standardised screw connection between frame and
temples makes temples swappable, so one frame can be worn with different
temples. Parts are printed separately by SLS in PA12 nylon, then depowdered,
smoothed, dyed and assembled.

The first version (workshop scope) should offer three frame shapes: Round,
Rounded Square and Cat-Eye (Hexagonal and Bold Frame are planned for later).
The user picks a shape, then adjusts the fit dimensions (frame width, bridge
size, temple length) and can enter measurements taken from their existing
glasses. Colours are Sage Green, Burgundy, Sand, Navy and Charcoal, chosen
separately for the frame and the temples. Temple textures are Smooth, Finely
Ribbed and Organically Perforated. Textures are applied to the outer temple
surfaces only: areas that touch the nose and ears stay smooth, and
perforations keep clear of the hinges. The user can add initials or a short
inscription on the inside of the temples. A live 3D model updates as choices
change, and designs can be saved. The personalisation flow we want to show
is: choose a frame shape → adjust dimensions → choose colours (frame and
temples) → pick a temple texture → add personal details (initials /
inscription) → preview and confirm → SLS print in PA12 → depowder, smooth and
dye → assemble with hinges, screws and lenses → refine based on feedback.
Virtual try-on is a possible future feature.

Visual direction: warm neutral backgrounds, muted colours and a matte nylon
look. It should look clearly distinct from the keycap configurator (light
technical drawing) and the perfume configurator (dark showroom, gold, serif).

Before writing any code, interview me about what it needs.
- Ask ONE question at a time and wait for my answer.
- Start broad (who is it for, what should they get at the end), then go
  specific (frame shapes, dimensions, parameters, ranges, measuring existing
  glasses, the standard hinges, screws and lenses and how the printed parts
  fit them, the swappable temple connection, colours, temple textures and
  where they may and may not go, initials / inscription, SLS and PA12
  tolerances, post-processing and dyeing, exports, saving designs, how it
  should look and feel).
- Ask which reference cases or existing products I want to learn from, and
  which ideas from them to use and which not.
- If my answer is vague, ask a follow-up.
- Suggest options when I'm unsure, but let me decide.
- After about 10–15 questions, summarise what you heard and ask me to confirm.

Then write PLAN.md with: goal, users, inputs → process → outputs,
parameters (name, unit, range), constraints, tech stack, pages,
out of scope, and a build order in small steps. Stop there.

Tech stack (do not change without asking me):
Vite + React + TypeScript + Tailwind CSS. UI components: shadcn/ui.
3D: React Three Fiber + drei. Rhino export: rhino3dm.
