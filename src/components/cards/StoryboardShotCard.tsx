export function StoryboardShotCard({ title, notes }: { title: string; notes: string }) {
  return (
    <article aria-label={title}>
      <h3>{title}</h3>
      <p>{notes}</p>
    </article>
  );
}
