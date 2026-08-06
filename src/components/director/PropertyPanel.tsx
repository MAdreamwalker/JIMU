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
            <input type="number" defaultValue={object.position.x} />
          </label>
          <label>
            旋转 Y
            <input type="number" defaultValue={object.rotation.y} />
          </label>
        </>
      ) : <p>选择一个对象</p>}
    </aside>
  );
}
