# Single-file export (interactive)

This project is built with React + Vite. To export an **interactive** `single.html` (same UI + menus + localStorage persistence), we use a build mode that inlines JS/CSS/assets into one file.

## Generate `dist/index.html` as a true single file

Run a build with the `singlefile` mode:

```bash
# using bun
bunx vite build --mode singlefile

# or npm
npx vite build --mode singlefile
```

That will produce:
- `dist/index.html` → **one self-contained HTML file** (JS/CSS/assets inlined)

## Notes
- It will look the same because it’s the same app bundle—just inlined.
- It remains local-first: `localStorage` keeps sessions/settings/presets.
- If you need the file to be named `single.html`, just rename `dist/index.html` after build.
