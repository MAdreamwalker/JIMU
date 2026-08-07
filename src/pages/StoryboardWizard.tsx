import { useEffect, useState } from 'react';
import type { PipelineDocument, PipelineStageKey } from '../domain/pipeline';

const stages: ReadonlyArray<{ key: PipelineStageKey; label: string }> = [
  { key: 'source', label: 'Source Import' },
  { key: 'chapterSplit', label: 'Chapter Split' },
  { key: 'assetExtract', label: 'Asset Extract' },
  { key: 'scriptGenerate', label: 'Script Generate' },
  { key: 'shotPlan', label: 'Shot Plan' },
  { key: 'storyboardPrompt', label: 'Storyboard Prompt' },
  { key: 'imageGenerate', label: 'Image Generate' },
  { key: 'videoPrompt', label: 'Video Prompt' },
  { key: 'videoGenerate', label: 'Video Generate' },
  { key: 'timelineBackfill', label: 'Timeline Backfill' },
];

export function StoryboardWizard({ projectId }: { projectId: string }) {
  const [pipeline, setPipeline] = useState<PipelineDocument | null>(null);

  useEffect(() => {
    let isCurrent = true;

    void window.jimu.pipeline.load(projectId).then((loadedPipeline) => {
      if (isCurrent) {
        setPipeline(loadedPipeline);
      }
    }).catch(() => {
      if (isCurrent) {
        setPipeline({ stages: {} });
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [projectId]);

  return (
    <section aria-labelledby="storyboard-title" data-project-id={projectId} aria-busy={pipeline === null}>
      <h1 id="storyboard-title" aria-label="Storyboard">Storyboard</h1>
      <ol>
        {stages.map((stage) => (
          <li key={stage.key}>
            <button type="button">{stage.label}</button>
          </li>
        ))}
      </ol>
    </section>
  );
}
