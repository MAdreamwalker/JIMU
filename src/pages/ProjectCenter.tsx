import { useState } from 'react';

export function ProjectCenter() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  async function createProject() {
    const project = await window.threecut.registry.create({ name, aspectRatio: '16:9' });
    setMessage(`已创建 ${project.name}`);
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
    </section>
  );
}
