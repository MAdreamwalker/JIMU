import { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { ProjectCenter } from './pages/ProjectCenter';
import { getHashPath, matchRoute } from './routes';

export function App() {
  const [path, setPath] = useState(() => getHashPath(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => setPath(getHashPath(window.location.hash));
    window.addEventListener('hashchange', handleHashChange);

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const route = matchRoute(path);
  const content = route.path === '/' ? <ProjectCenter /> : <h1>{route.title}</h1>;

  return (
    <Layout>
      {content}
    </Layout>
  );
}
