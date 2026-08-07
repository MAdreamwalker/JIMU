import { useEffect, useState } from 'react';
import { AssetCard } from '../components/cards/AssetCard';
import type { Asset } from '../domain/canvas';

const labels: Record<Asset['kind'], string> = {
  character: 'Characters',
  scene: 'Scenes',
  prop: 'Props',
  style: 'Styles',
  reference: 'References',
};

export function CreationCanvas({ projectId }: { projectId: string }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    void window.jimu.canvas.load(projectId).then((document) => {
      if (isCurrent) {
        setAssets(document.assets);
        setLoadError('');
      }
    }).catch((error: unknown) => {
      if (isCurrent) {
        setAssets([]);
        setLoadError(error instanceof Error ? error.message : 'Unable to load canvas');
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [projectId]);

  return (
    <section aria-labelledby="canvas-title" data-project-id={projectId}>
      <h1 id="canvas-title">Canvas</h1>
      {loadError ? <p role="alert">{loadError}</p> : null}
      {Object.entries(labels).map(([kind, label]) => (
        <section key={kind} aria-labelledby={`asset-${kind}`}>
          <h2 id={`asset-${kind}`}>{label}</h2>
          {assets.filter((asset) => asset.kind === kind).map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </section>
      ))}
    </section>
  );
}
