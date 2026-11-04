# Eyewear Configurator

A mobile and web configurator for personalised 3D-printed modular glasses.
Printed PA12 frame and swappable temples, combined with standard metal hinges,
screws and lenses. See `CONCEPT.md` for the product brief and `PLAN.md` for
the plan and build order.

## Run locally

```bash
npm install
npm run dev
```

## Deploy

Every push to `main` builds the site and publishes it to GitHub Pages
(`.github/workflows/deploy-pages.yml`). One-time setup on GitHub:
Settings → Pages → Source: "GitHub Actions".
