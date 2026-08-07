import { useEffect, useState } from 'react';
import { DirectorViewport } from '../components/director/DirectorViewport';
import { ObjectPanel } from '../components/director/ObjectPanel';
import { PropertyPanel } from '../components/director/PropertyPanel';
import type { DirectorDocument } from '../domain/director';

const emptyDirector: DirectorDocument = { objects: [], snapshots: [] };

export function DirectorWorkspace({ projectId }: { projectId: string }) {
  const [director, setDirector] = useState<DirectorDocument>(emptyDirector);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    void window.jimu.director.load(projectId).then((loadedDirector) => {
      if (isCurrent) {
        setDirector(loadedDirector);
        setSelectedObjectId(loadedDirector.objects[0]?.id ?? null);
        setLoadError('');
      }
    }).catch((error: unknown) => {
      if (isCurrent) {
        setDirector(emptyDirector);
        setSelectedObjectId(null);
        setLoadError(error instanceof Error ? error.message : 'Unable to load director');
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [projectId]);

  const selectedObject = director.objects.find((object) => object.id === selectedObjectId) ?? null;

  return (
    <section aria-labelledby="director-title" data-project-id={projectId}>
      <h1 id="director-title">Director</h1>
      {loadError ? <p role="alert">{loadError}</p> : null}
      <ObjectPanel
        objects={director.objects}
        snapshots={director.snapshots}
        selectedObjectId={selectedObjectId}
        onSelectObject={setSelectedObjectId}
      />
      <DirectorViewport />
      <PropertyPanel object={selectedObject} />
    </section>
  );
}
