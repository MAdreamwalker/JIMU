import { useEffect, useState } from 'react';
import type { ProjectMetadata } from '../domain/project';

export function ProjectCenter() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loadError, setLoadError] = useState('');
  const [createError, setCreateError] = useState('');
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);

  useEffect(() => {
    let isCurrent = true;

    async function loadProjects() {
      try {
        const loadedProjects = await window.jimu.registry.list();
        if (isCurrent) {
          setProjects(loadedProjects);
        }
      } catch (error) {
        if (isCurrent) {
          setLoadError(`Unable to load projects: ${getErrorMessage(error)}`);
        }
      }
    }

    void loadProjects();

    return () => {
      isCurrent = false;
    };
  }, []);

  async function createProject() {
    try {
      const project = await window.jimu.registry.create({ name, aspectRatio: '16:9' });
      setProjects((currentProjects) => [...currentProjects, project]);
      setCreateError('');
      setMessage(`Created ${project.name}`);
    } catch (error) {
      setMessage('');
      setCreateError(`Unable to create project: ${getErrorMessage(error)}`);
    }
  }

  async function importProjectPackage() {
    try {
      const importedProject = await window.jimu.projectPackage.importWithDialog();
      setCreateError('');
      if (!importedProject) {
        setMessage('Import cancelled');
        return;
      }

      setProjects((currentProjects) => [...currentProjects, importedProject]);
      setMessage(`Imported ${importedProject.name}`);
    } catch (error) {
      setMessage('');
      setCreateError(`Unable to import project: ${getErrorMessage(error)}`);
    }
  }

  async function exportProjectPackage(project: ProjectMetadata) {
    try {
      const exportedPath = await window.jimu.projectPackage.exportWithDialog(project.id);
      setCreateError('');
      setMessage(exportedPath ? `Exported ${project.name}` : 'Export cancelled');
    } catch (error) {
      setMessage('');
      setCreateError(`Unable to export project: ${getErrorMessage(error)}`);
    }
  }

  return (
    <section aria-labelledby="project-title">
      <h1 id="project-title">Project Center</h1>
      <label>
        Project Name
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <button type="button" onClick={createProject}>Create Project</button>
      <button type="button" onClick={importProjectPackage}>Import .JIMU</button>
      {message ? <p role="status">{message}</p> : null}
      {loadError ? <p role="alert">{loadError}</p> : null}
      {createError ? <p role="alert">{createError}</p> : null}
      <ul aria-label="Project List">
        {projects.map((project) => (
          <li key={project.id}>
            <span>{project.name}</span>
            <button type="button" onClick={() => { void exportProjectPackage(project); }}>
              Export {project.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}
