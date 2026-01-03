import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';

interface AppLayoutProps {
  children: ReactNode;
  frame?: boolean;
}

export function AppLayout({ children, frame = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100">
      <div className="flex min-h-screen w-full gap-4 p-4">
        <AppSidebar />
        <main className={frame ? 'flex-1 overflow-hidden rounded-2xl bg-white' : 'flex-1 overflow-visible'}>
          <div className="h-full overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
