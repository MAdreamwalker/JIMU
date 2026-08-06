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
        const loadedProjects = await window.threecut.registry.list();
        if (isCurrent) {
          setProjects(loadedProjects);
        }
      } catch (error) {
        if (isCurrent) {
          setLoadError(`无法加载项目：${getErrorMessage(error)}`);
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
      const project = await window.threecut.registry.create({ name, aspectRatio: '16:9' });
      setProjects((currentProjects) => [...currentProjects, project]);
      setCreateError('');
      setMessage(`已创建 ${project.name}`);
    } catch (error) {
      setMessage('');
      setCreateError(`创建项目失败：${getErrorMessage(error)}`);
    }
  }

  return (
    <section aria-labelledby="project-title">
      <h1 id="project-title">项目中心</h1>
      <label>
        项目名称
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <button type="button" onClick={createProject}>创建项目</button>
      {message ? <p role="status">{message}</p> : null}
      {loadError ? <p role="alert">{loadError}</p> : null}
      {createError ? <p role="alert">{createError}</p> : null}
      <ul aria-label="项目列表">
        {projects.map((project) => <li key={project.id}>{project.name}</li>)}
      </ul>
    </section>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '未知错误';
}
