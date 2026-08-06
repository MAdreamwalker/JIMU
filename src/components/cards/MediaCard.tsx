export function MediaCard({ mediaPath, label = mediaPath }: { mediaPath: string; label?: string }) {
  return (
    <article aria-label={label}>
      <h3>{label}</h3>
      <p>{mediaPath}</p>
    </article>
  );
}
