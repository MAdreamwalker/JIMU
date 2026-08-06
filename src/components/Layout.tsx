import { FolderKanban, ListChecks, Settings } from 'lucide-react';
import type { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  return (
    <div className="app-shell">
      <aside>
        <nav aria-label="Primary">
          <a href="#/">
            <FolderKanban size={18} aria-hidden="true" />
            椤圭洰
          </a>
          <a href="#/tasks">
            <ListChecks size={18} aria-hidden="true" />
            浠诲姟
          </a>
          <a href="#/settings">
            <Settings size={18} aria-hidden="true" />
            璁剧疆
          </a>
        </nav>
      </aside>
      <main>{children}</main>
    </div>
  );
}
