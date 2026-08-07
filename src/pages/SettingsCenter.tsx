import { useEffect, useState } from 'react';

export function SettingsCenter() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      window.jimu.config.getAll(),
      window.jimu.storyboardPrompts.read(),
      window.jimu.skills.list(),
    ])
      .then(() => setLoaded(true))
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : 'Unknown error');
      });
  }, []);

  return (
    <section aria-labelledby="settings-title">
      <h1 id="settings-title">Settings</h1>
      <h2>Model Settings</h2>
      <h2>Cloud Account</h2>
      <h2>Generation Parameters</h2>
      <h2>Prompt Management</h2>
      <h2>Skills Management</h2>
      <h2>Security and Storage</h2>
      {loaded ? <p role="status">Settings loaded</p> : null}
      {error ? <p role="alert">Unable to load settings: {error}</p> : null}
    </section>
  );
}
