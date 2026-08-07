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
      <h2 id="director-objects-title">Objects</h2>
      <div>
        <button type="button">Add Actor</button>
        <button type="button">Add Camera</button>
        <button type="button">Add Light</button>
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
      ) : <p>No objects</p>}
      <h3>Snapshots</h3>
      {snapshots.length > 0 ? (
        <ul aria-label="Director snapshots">
          {snapshots.map((snapshot) => <li key={snapshot.id}>{snapshot.name}</li>)}
        </ul>
      ) : <p>No snapshots</p>}
    </aside>
  );
}
