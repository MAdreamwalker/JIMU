import type { DirectorObject } from '../../domain/director';

export function PropertyPanel({ object }: { object: DirectorObject | null }) {
  return (
    <aside aria-labelledby="director-properties-title">
      <h2 id="director-properties-title">Properties</h2>
      {object ? (
        <>
          <p>{object.name}</p>
          <label>
            Position X
            <input data-testid="director-position-x" type="number" value={object.position.x} readOnly />
          </label>
          <label>
            Rotation Y
            <input data-testid="director-rotation-y" type="number" value={object.rotation.y} readOnly />
          </label>
        </>
      ) : <p>Select an object</p>}
    </aside>
  );
}
