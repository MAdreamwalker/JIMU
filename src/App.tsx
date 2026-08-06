import { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { getHashPath, matchRoute } from './routes';

export function App() {
  const [path, setPath] = useState(() => getHashPath(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => setPath(getHashPath(window.location.hash));
    window.addEventListener('hashchange', handleHashChange);

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const route = matchRoute(path);

  return (
    <Layout>
      <h1>{route.title}</h1>
    </Layout>
  );
}
