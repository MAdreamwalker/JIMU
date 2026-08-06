import { RotateCcw, Square } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { TaskListItem } from '../../electron/ipc/registerTaskHandlers';

const statusOrder = ['running', 'queued', 'failed', 'partially-succeeded', 'succeeded', 'cancelled'];

export function TaskCenter() {
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isCurrent = true;
    void window.threecut.tasks.list().then((loadedTasks) => {
      if (isCurrent) {
        setTasks(loadedTasks);
        setLoadError('');
      }
    }).catch((error: unknown) => {
      if (isCurrent) setLoadError(error instanceof Error ? error.message : 'Unable to load tasks');
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  const counts = statusOrder.map((status) => ({
    status,
    count: tasks.filter((task) => task.status === status).length,
  }));

  return (
    <section aria-labelledby="tasks-title">
      <h1 id="tasks-title">Tasks</h1>
      {loadError ? <p role="alert">{loadError}</p> : null}
      <dl aria-label="Task status summary">
        {counts.map((item) => (
          <div key={item.status}>
            <dt>{item.status}</dt>
            <dd>{item.count}</dd>
          </div>
        ))}
      </dl>
      {tasks.length === 0 ? (
        <p role="status">No tasks</p>
      ) : (
        <ul aria-label="Task queue">
          {tasks.map((task) => (
            <li key={`${task.projectId}:${task.id}`}>
              <article aria-labelledby={`task-${task.id}`}>
                <h2 id={`task-${task.id}`}>{task.category}</h2>
                <p>{task.projectName}</p>
                <p>{task.status}</p>
                {task.errorCategory ? <p role="alert">{task.errorCategory}</p> : null}
                <p>{task.inputSummary}</p>
                <p>{task.outputSummary}</p>
                <button type="button" aria-label={`Retry ${task.id}`} disabled>
                  <RotateCcw size={16} aria-hidden="true" />
                </button>
                <button type="button" aria-label={`Cancel ${task.id}`} disabled>
                  <Square size={16} aria-hidden="true" />
                </button>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
