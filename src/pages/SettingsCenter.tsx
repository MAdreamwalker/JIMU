import { useEffect, useState } from 'react';

export function SettingsCenter() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      window.threecut.config.getAll(),
      window.threecut.storyboardPrompts.read(),
      window.threecut.skills.list(),
    ])
      .then(() => setLoaded(true))
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : 'Unknown error');
      });
  }, []);

  return (
    <section aria-labelledby="settings-title">
      <h1 id="settings-title">设置</h1>
      <h2>模型设置</h2>
      <h2>云端账户</h2>
      <h2>生成参数</h2>
      <h2>Prompt 管理</h2>
      <h2>Skills 管理</h2>
      <h2>安全与存储</h2>
      {loaded ? <p role="status">设置已加载</p> : null}
      {error ? <p role="alert">无法加载设置：{error}</p> : null}
    </section>
  );
}
