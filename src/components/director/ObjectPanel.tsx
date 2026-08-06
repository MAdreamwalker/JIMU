import type { DirectorObject, DirectorSnapshot } from '../../domain/director';

type ObjectPanelProps = {
  objects: DirectorObject[];
  snapshots: DirectorSnapshot[];
  selectedObjectId: string | null;
  onSelectObject: (objectId: string) => void;
};

export function ObjectPanel({ objects, snapshots, selectedObjectId, onSelectObject }: ObjectPanelProps) {
  return (
    <aside aria-labelledby="director-objects-title">
      <h2 id="director-objects-title">瀵硅薄</h2>
      <div>
        <button type="button">娣诲姞婕斿憳</button>
        <button type="button">娣诲姞鎽勫奖鏈?</button>
        <button type="button">娣诲姞鐏厜</button>
      </div>
      {objects.length > 0 ? (
        <ul aria-label="Director objects">
          {objects.map((object) => (
            <li key={object.id}>
              <button
                type="button"
                aria-pressed={object.id === selectedObjectId}
                onClick={() => onSelectObject(object.id)}
              >
                {object.name}
              </button>
            </li>
          ))}
        </ul>
      ) : <p>暂无对象</p>}
      <h3>快照</h3>
      {snapshots.length > 0 ? (
        <ul aria-label="Director snapshots">
          {snapshots.map((snapshot) => <li key={snapshot.id}>{snapshot.name}</li>)}
        </ul>
      ) : <p>暂无快照</p>}
    </aside>
  );
}
