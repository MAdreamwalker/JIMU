import type { DirectorObject } from '../../domain/director';

export function PropertyPanel({ object }: { object: DirectorObject | null }) {
  return (
    <aside aria-labelledby="director-properties-title">
      <h2 id="director-properties-title">属性</h2>
      {object ? (
        <>
          <p>{object.name}</p>
          <label>
            位置 X
            <input data-testid="director-position-x" type="number" value={object.position.x} readOnly />
          </label>
          <label>
            旋转 Y
            <input data-testid="director-rotation-y" type="number" value={object.rotation.y} readOnly />
          </label>
        </>
      ) : <p>选择一个对象</p>}
    </aside>
  );
}
