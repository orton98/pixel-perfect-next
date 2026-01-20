# Portable export (3 files: HTML + CSS + JS)

If you need a portable build as exactly **three files**:

- `dist/index.html`
- `dist/style.css`
- `dist/app.js`

…use the `portable` build mode.

## Build

```bash
# bun
bunx vite build --mode portable

# npm
npx vite build --mode portable
```

## Notes
- This keeps the UI identical (it’s the same app bundle), just emitted as 3 files instead of many hashed assets.
- `localStorage` persistence still works.
- If you import additional static assets (images/fonts), they will be emitted as extra files. To stay strictly at 3 files, keep assets embedded (SVG inline) or use the `singlefile` mode instead.
