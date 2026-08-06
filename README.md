# 3cut-like Desktop

## Development

Install dependencies:

```bash
pnpm install
```

Run tests:

```bash
pnpm test
```

Run typecheck:

```bash
pnpm typecheck
```

Run the renderer dev server:

```bash
pnpm dev
```

Build the production renderer and Electron entrypoints:

```bash
pnpm build
```

To launch Electron against the built app, run `pnpm electron:dev` after a
successful build. For renderer development, use the Vite URL printed by
`pnpm dev`.

## Workflow

The current app provides the desktop shell for this workflow: create a
project, inspect the canvas, storyboard, director, and timeline views, persist
their project documents, and queue an MP4 export job with progress/cancellation
contracts. The storyboard stages and Settings surfaces expose the shape of the
prose-to-MP4 flow, but they are not a complete provider-backed generation
engine.

Provider credentials, media analysis, image/video generation, and related
asset confirmation are validation or shell paths in this package. Configure
local providers in Settings before exercising those paths; no external model
service is bundled here. Project archive export validates its destination
contract, while archive import is currently a validation path and does not yet
restore a project.

## Packaging Notes

The production build writes the renderer bundle to `dist/` and Electron
artifacts to `dist-electron/`. The repository does not include proprietary
media or provider credentials; configure local providers in the app before
running media-generation stages.
