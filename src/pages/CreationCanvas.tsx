import { useEffect, useState } from 'react';
import { AssetCard } from '../components/cards/AssetCard';
import type { Asset } from '../domain/canvas';

const labels: Record<Asset['kind'], string> = {
  character: '瑙掕壊',
  scene: '鍦烘櫙',
  prop: '鐗╁搧',
  style: '椋庢牸',
  reference: '鍙傝€冨浘',
};

export function CreationCanvas({ projectId }: { projectId: string }) {
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    let isCurrent = true;

    void window.threecut.canvas.load(projectId).then((document) => {
      if (isCurrent) {
        setAssets(document.assets);
      }
    }).catch(() => {
      if (isCurrent) {
        setAssets([]);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [projectId]);

  return (
    <section aria-labelledby="canvas-title" data-project-id={projectId}>
      <h1 id="canvas-title">鍒涗綔鐢诲竷</h1>
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
