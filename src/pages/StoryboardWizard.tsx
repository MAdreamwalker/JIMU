import { useEffect, useState } from 'react';
import type { PipelineDocument, PipelineStageKey } from '../domain/pipeline';

const stages: ReadonlyArray<{ key: PipelineStageKey; label: string }> = [
  { key: 'source', label: '文案导入' },
  { key: 'chapterSplit', label: '章节划分' },
  { key: 'assetExtract', label: '资产提取' },
  { key: 'scriptGenerate', label: '剧本生成' },
  { key: 'shotPlan', label: '镜头规划' },
  { key: 'storyboardPrompt', label: '分镜提示词' },
  { key: 'imageGenerate', label: '图片生成' },
  { key: 'videoPrompt', label: '视频提示词' },
  { key: 'videoGenerate', label: '视频生成' },
  { key: 'timelineBackfill', label: '回填时间线' },
];

export function StoryboardWizard({ projectId }: { projectId: string }) {
  const [pipeline, setPipeline] = useState<PipelineDocument | null>(null);

  useEffect(() => {
    let isCurrent = true;

    void window.threecut.pipeline.load(projectId).then((loadedPipeline) => {
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
      <h1 id="storyboard-title" aria-label="Storyboard">分镜向导</h1>
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
