import type { Asset } from '../../domain/canvas';

export function AssetCard({ asset }: { asset: Asset }) {
  return (
    <article aria-label={asset.name}>
      <h3>{asset.name}</h3>
      <p>{asset.description}</p>
      <small>{asset.state} | v{asset.version}</small>
    </article>
  );
}
