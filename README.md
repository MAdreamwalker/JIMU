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

Create a project, import source text, run storyboard stages, confirm assets,
generate images and videos, assemble timeline media, and export an MP4 job.
The project center, canvas, storyboard, director, and timeline views are
available from the project workflow, while provider credentials, storyboard
prompts, and skills are managed in Settings.

## Packaging Notes

The production build writes the renderer bundle to `dist/` and Electron
artifacts to `dist-electron/`. The repository does not include proprietary
media or provider credentials; configure local providers in the app before
running media-generation stages.
