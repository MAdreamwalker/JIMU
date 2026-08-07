# JIMU AI Visual Creation Desktop App Design

Date: 2026-08-06

## Goal

Build an original Electron desktop application inspired by the observed JIMU workflow. The product should support a complete AI visual content pipeline: project setup, storyboarding, asset management, 3D director previsualization, image and video generation, timeline editing, media analysis, MP4 export, project packaging, Prompt management, Skills management, third-party model keys, and optional cloud account/credits.

This is not a source-code or asset clone of the installer. The implementation will be original, using the installer only as a product-function reference.

## Product Shape

The target app is an Electron desktop tool with:

- Electron main process for local files, IPC, ffmpeg, project import/export, encrypted settings, downloads, and media analysis.
- React renderer for the interface.
- Three.js for the director workspace and camera previsualization.
- ffmpeg and ffprobe for thumbnails, waveforms, media inspection, and MP4 export.
- A unified AI Provider layer for text, image, video, polling, uploads, and model capability detection.

## Core Pages

### Home / Project Center

The project center shows project list, recent projects, create project, import project package, and material root selection. Each project has name, aspect ratio, type, cover image, creation time, update time, and progress state.

### Creation Canvas

The canvas is the central project workspace. It manages source text, extracted assets, generated images, generated videos, storyboards, references, audio, subtitles, and selected outputs. Cards can be sent to the storyboard pipeline, director workspace, or timeline.

### Storyboard Wizard

The wizard converts source text into production-ready shots through saved, editable stages:

1. Source text import
2. Chapter split
3. Asset extraction
4. Script generation
5. Shot planning
6. Storyboard image prompt generation
7. Image generation
8. Video prompt generation
9. Video generation
10. Timeline backfill

Every stage stores input, output, status, model, Prompt version, and retry history.

### Director Workspace

The director workspace is a Three.js 3D previsualization tool. It provides a 3D viewport, object panel, property panel, camera views, actor poses, lights, props, scene placeholders, camera presets, automatic composition, and shot snapshots. It outputs camera screenshots, overhead maps, lighting diagrams, shot JSON, and image-generation references.

### Timeline Editor

The timeline assembles images, videos, audio, subtitles, transitions, and shot markers into a final sequence. It supports basic trimming, ordering, still-image duration, volume, fades, subtitle timing, thumbnail analysis, waveform analysis, and ffmpeg MP4 export.

### Task Center

The task center records text, image, video, media, download, batch, and export tasks. Each task includes state, provider, model, input summary, output summary, duration, cost/credits, error category, retry/cancel controls, and raw response summary with secrets removed.

### Settings Center

Settings include basic preferences, local storage, third-party Provider keys, model routes, cloud login/credits, generation defaults, Prompt management, Skills management, cache cleanup, import/export safety, and update settings.

## Local Architecture

### Electron Main Process

Responsibilities:

- Window creation and frame controls.
- Safe IPC handler registry.
- Project creation, loading, updating, deletion, import, and export.
- File read/write/copy/move/delete within authorized directories.
- Local file URL mediation.
- Media download with SSRF protections.
- ffmpeg/ffprobe media analysis and MP4 export.
- Global configuration storage.
- Windows DPAPI encryption for API keys and cloud tokens.
- Task progress events.

### React Renderer

Responsibilities:

- Page routing and state orchestration.
- Canvas, wizard, director workspace, timeline, task center, and settings UI.
- Calling main-process capabilities only through preload APIs.
- Normalizing Provider responses into user-facing task state.

### Preload API

The preload bridge exposes narrow APIs:

- `config:*`
- `registry:*`
- `project:*`
- `canvas:*`
- `pipeline:*`
- `director:*`
- `timeline:*`
- `media-analysis:*`
- `file:*`
- `dialog:*`
- `storyboardPrompts:*`
- `skills:*`
- `video:testCapabilities`
- `window:*`

Renderer code must not directly access arbitrary filesystem or shell APIs.

## Project File Structure

Each project is a standalone folder:

```text
ProjectName/
  project.json
  canvas.json
  pipeline.json
  director.json
  timeline.json
  tasks.json
  prompts/
    storyboard.json
    video.json
  media/
    images/
    videos/
    audio/
    references/
    thumbnails/
  exports/
  cache/
```

### Key Files

- `project.json`: metadata, aspect ratio, type, cover, created/updated timestamps, version.
- `canvas.json`: cards, assets, generated outputs, selected media references.
- `pipeline.json`: storyboard wizard stages, state, versions, task links.
- `director.json`: 3D scene, actors, props, lights, cameras, snapshots.
- `timeline.json`: tracks, clips, subtitles, markers, export settings.
- `tasks.json`: task history, status, provider summaries, normalized errors.
- `media/`: user and generated media files.
- `cache/`: thumbnails, waveforms, proxy media, temporary export files.

JSON stores relative media paths, not embedded large files.

## Global Data

Global app data is stored in Electron `userData`:

```text
JIMU-config.json
project-registry.json
skills.json
storyboard-prompts.json
provider-cache.json
```

Sensitive fields such as `apiKey`, `imageGen.apiKey`, `videoGen.apiKey`, and `cloud.token` are encrypted with Windows DPAPI on Windows. Non-sensitive fields stay readable for migration and troubleshooting.

## Storyboard Pipeline

### Source Text Import

Input: title, body, genre, aspect ratio, style references, episode/chapter metadata.

Output: normalized project source text.

Supports paste, `.txt`, `.md`, and `.docx` import. The app can clean empty lines and preserve source ranges for later traceability.

### Chapter Split

Splits long text into narrative sections.

Output fields: chapter title, summary, source range, main characters, scene hint.

Users can merge, split, rename, edit, skip, and rerun.

### Asset Extraction

Extracts characters, scenes, props, and visual motifs.

Character assets include identity, appearance, outfit, personality, reference prompt, and optional reference image.

Scene assets include location, era, lighting, mood, and reference prompt.

Prop assets include purpose and visual traits.

### Script Generation

Converts prose into a filmable script.

Rules:

- Do not continue beyond the source text.
- Preserve core facts, causality, key dialogue, and suspense.
- Convert narration into camera-ready action where appropriate.
- Mark inferred visual traits separately from explicit source traits.

### Shot Planning

Breaks the script into shots.

Each shot includes shot number, scene, characters, action, shot size, angle, camera movement, duration, sound, emotional purpose, and dependencies on assets.

### Storyboard Prompt Generation

Converts shots into image prompts.

Each prompt includes positive prompt, negative prompt, aspect ratio, style, shot tags, character references, scene references, and locked consistency fields.

### Image Generation

Supports text-to-image, image-to-image, multiple references, batch generation, retry, model switching, external image import, selected image, and failure details.

### Video Prompt Generation

Builds video prompts from selected images and shot plans.

Each prompt includes motion, camera movement, duration, first-frame reference, optional last-frame reference, and model parameters.

### Video Generation

Supports text-to-video, image-to-video, video-to-video/inpainting as a later enhancement, batch jobs, polling, cancellation, retry, and provider task IDs.

### Timeline Backfill

The pipeline can generate an initial `timeline.json` from shots, selected images, generated videos, audio, and subtitles.

## Director Workspace

### Viewport

The 3D viewport supports orbit view, camera view, top view, selectable objects, transform controls, camera frame overlays, and snapshot rendering.

### Objects

Objects include actors, scenes, props, lights, and cameras. Every object can be named, hidden, locked, duplicated, deleted, and bound to an asset.

### Actors

The first version includes built-in male and female base models with pose presets:

- Standing
- Formal standing
- Relaxed standing
- Sitting
- Leaning forward
- Crouching
- Walking
- Running
- Pointing
- Waving
- Alert pose

Simplified body controls include head yaw/pitch, chest lean, pelvis tilt, shoulders, elbows, and knees.

Actors can look at camera, another actor, or a prop. Asset binding connects a canvas character asset to a 3D placeholder and supplies consistent prompt metadata for generation.

### Scenes And Props

Built-in placeholders include empty stage, room, street, forest, sci-fi space, wall, table, chair, cube, door, and stairs. Later versions support `.glb` and `.gltf` import plus HDRI environments.

### Cameras And Lights

Camera presets include wide shot, full shot, medium shot, close-up, extreme close-up, overhead, low angle, over-the-shoulder, and top map.

Lights include ambient, area, point, and spot lights. Automatic composition can place a camera around selected actors and then let users adjust.

### Outputs

The director workspace outputs camera screenshot, overhead map, lighting diagram, shot JSON, storyboard reference image, and image-to-image reference input.

## Creation Canvas And Assets

### Card Types

- Source text card
- Character card
- Scene card
- Prop card
- Storyboard shot card
- Image card
- Video card
- Audio/subtitle card

Cards expose actions based on type: edit, duplicate, send to wizard, send to director, send to timeline, mark selected, save as asset, or hide.

### Asset States

- Draft: extracted but not confirmed.
- Confirmed: usable in generation.
- Bound: connected to director or timeline data.
- Deprecated: preserved for traceability but hidden by default.

Assets support version history so old shots remain traceable after a role, scene, or prompt is edited.

## Task Center

Task states:

- Queued
- Running
- Succeeded
- Failed
- Cancelled
- Partially succeeded

Task categories:

- Text
- Image
- Video
- Batch
- Media analysis
- Download
- Export

Error categories:

- Authentication
- Insufficient balance or credits
- Rate limit
- Safety review
- Network timeout
- Unsupported model
- Parameter error
- Provider server error
- Unknown error

Task details must remove secrets before storing raw summaries.

## Timeline And Export

### Tracks

- Video track
- Image track
- Audio track
- Subtitle track
- Marker track

### Clip Controls

Clips support reorder, trim, duplicate, delete, duration, in/out points, volume, fade in/out, still-image motion, mute, frame capture, replace media, subtitle style, and subtitle timing.

### Media Analysis

The main process uses ffprobe/ffmpeg to inspect duration, resolution, frame rate, codecs, audio tracks, thumbnails, waveform peaks, proxy preview files, missing assets, and unsupported formats.

### MP4 Export

Export settings:

- Aspect ratio: 16:9, 9:16, 1:1, 4:3, custom.
- Resolution: 720p, 1080p, 2K, 4K.
- Frame rate: 24, 25, 30, 60.
- Video codec: H.264 by default, H.265 later.
- Audio codec: AAC 48 kHz.
- Subtitle mode: burned-in or `.srt`.
- Cover: first shot or selected frame.

Export flow:

1. Validate timeline and media paths.
2. Generate concat/filter instructions.
3. Run ffmpeg.
4. Emit progress, speed, and ETA.
5. Write to `exports/`.
6. Preserve failure logs without secrets.

## AI Provider Layer

Unified capability interfaces:

```text
TextGeneration
ImageGeneration
VideoGeneration
ImageToVideo
VideoToVideo
MediaUpload
TaskPolling
```

### Third-party Key Mode

Users can configure:

- OpenAI-compatible text models.
- OpenAI-compatible image models.
- Gemini text and multimodal models.
- Bailian/Qwen/Wanxiang-style APIs.
- Custom image gateways.
- Custom video gateways.

Provider configuration includes Base URL, API Key, model name, API format, supported capabilities, polling rules, default parameters, timeout, retry count, and concurrency.

Settings provide test connection and capability detection.

### Cloud Account Mode

Optional cloud mode includes login, token refresh, credits/balance, cloud task submission, cloud media upload, task polling, refund/partial charge metadata, safety review responses, and billing history.

Cloud mode is for users who do not want to configure their own model keys. Third-party key mode remains available for advanced users and private deployments.

### Model Routing

Default routes can be configured per task:

- Script and shot planning: text model.
- Asset extraction: text or vision model.
- Storyboard images: image model.
- Director reference enhancement: image-to-image model.
- Shot videos: image-to-video model.
- Inpainting or repainting: image/video editing model.

Provider errors are normalized into product-facing categories.

## Prompt Management

Prompts are editable files, not hard-coded strings:

```text
prompts/
  chapter-split.md
  asset-extract.md
  script-generate.md
  shot-plan.md
  storyboard-image.md
  video-prompt.md
  director-compose.md
```

Users can edit, restore default, copy, import, and export Prompt templates. Every generation task records the Prompt version used.

## Skills Management

Skills are user-defined workflow extensions:

```text
skills/
  skill-id/
    skill.json
    instruction.md
```

Use cases include genre-specific storyboard rules, character description standards, shot-language preferences, platform submission formats, and internal review rules.

Version one treats Skills as markdown instructions plus JSON metadata. Future versions can add tool execution.

## Security

Security rules:

- Renderer never directly reads or writes arbitrary files.
- All file operations go through main-process validation.
- Paths are restricted to project directories, user-authorized directories, or app cache directories.
- Imported project packages block path traversal, illegal paths, excess file count, excess file size, and excess decompressed size.
- Media downloads block localhost, LAN, and reserved network targets.
- External links only allow `http` and `https`.
- API keys and cloud tokens are encrypted.
- Task logs redact secrets.
- Export and media-analysis jobs are cancellable.
- Failed jobs preserve diagnostic logs without exposing credentials.

## Implementation Phases

### Phase 1: Product Shell

Electron, React, routing, project center, settings center, project registry, local project structure, IPC safety layer, encrypted config.

### Phase 2: Creation Canvas And Asset Library

Canvas cards, source text, character/scene/prop assets, image/video cards, media import, asset states, project persistence.

### Phase 3: Storyboard Pipeline

Chapter split, asset extraction, script generation, shot planning, prompt generation, task center, error normalization, stage versions.

### Phase 4: Image And Video Generation

Provider layer, third-party keys, model capability detection, image generation, video generation, polling, cancellation, batch tasks, cloud-mode API placeholders.

### Phase 5: Director Workspace

Three.js viewport, base actors, pose presets, body controls, props, lights, cameras, auto composition, snapshots, reference export.

### Phase 6: Timeline And Export

Timeline tracks, clips, subtitles, thumbnail analysis, waveform analysis, ffmpeg export, progress, cancellation, logs.

### Phase 7: Project Packaging And Extension

Project import/export, Prompt management, Skills management, cache cleanup, safety hardening, full acceptance testing.

## Acceptance Criteria

The complete product is accepted when a user can:

1. Create a project from raw prose.
2. Split the prose into chapters.
3. Extract and confirm characters, scenes, and props.
4. Generate a script.
5. Plan shots.
6. Generate storyboard image prompts.
7. Generate and select storyboard images.
8. Generate video prompts.
9. Generate and select shot videos.
10. Use the director workspace to create a controllable reference shot.
11. Send selected media to the timeline.
12. Add audio and subtitles.
13. Analyze thumbnails and waveforms.
14. Export an MP4.
15. Package and import/export the project.
16. Configure third-party Provider keys.
17. Use optional cloud account/credits.
18. Edit Prompt templates.
19. Manage Skills.
20. Recover from failed tasks with clear errors and retry controls.

## Open Implementation Notes

- The first implementation should prioritize project structure and persistence before AI generation.
- Director workspace should start as a practical previsualization tool, not a full DCC editor.
- Timeline editing should stay lightweight and focused on AI storyboard assembly.
- Cloud account mode can be designed in interfaces first and connected later.
- Provider capability detection is important because image and video APIs vary heavily by vendor.
