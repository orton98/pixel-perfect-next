# Single-file export (interactive)

This project is built with React + Vite. To export an **interactive** `single.html` (same UI + menus + localStorage persistence), we use a build mode that inlines JS/CSS/assets into one file.

## Generate `dist/single.html`

1) Build the single-file bundle:

```bash
# using bun
bunx vite build --mode singlefile

# or npm
npx vite build --mode singlefile
```

2) Copy the output to `dist/single.html`:

```bash
node scripts/postbuild-singlefile.mjs
```

## Make it automatic (recommended)

Lovable projects keep `package.json` read-only here, so the repo includes the helper script, but you’ll need to add the hook in your local repo:

```jsonc
{
  "scripts": {
    "build:singlefile": "vite build --mode singlefile && node scripts/postbuild-singlefile.mjs"
  }
}
```

Then you can run:

```bash
bun run build:singlefile
# or
npm run build:singlefile
```

## Notes
- It will look the same because it’s the same app bundle—just inlined.
- It remains local-first: `localStorage` keeps sessions/settings/presets.

