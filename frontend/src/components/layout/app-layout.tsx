import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  const location = useLocation();

  // Fecha sidebar ao navegar em telas mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  return (
    <div className="relative h-screen w-screen bg-[#F4F5F7] p-2 md:p-3 overflow-hidden flex select-none">
      {/* Background Sidebar Layer */}
      <aside
        className={cn(
          'absolute left-2 top-2 bottom-2 md:left-3 md:top-3 md:bottom-3 z-0 transition-all duration-300 ease-in-out',
          sidebarOpen
            ? 'w-64 opacity-100 pointer-events-auto'
            : 'w-64 max-md:opacity-0 max-md:pointer-events-none md:w-14 opacity-100 pointer-events-auto',
        )}
      >
        <Sidebar
          isCollapsed={!sidebarOpen}
          onItemClick={() => {
            if (window.innerWidth < 768) {
              setSidebarOpen(false);
            }
          }}
          className={cn(
            'h-full w-full border-r-0 bg-transparent transition-all duration-300',
            sidebarOpen ? 'p-3' : 'p-1 md:py-2 md:px-1',
          )}
        />
      </aside>

      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/20 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Floating Main Content Card */}
      <div
        className={cn(
          'relative z-20 flex-1 flex flex-col h-full bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-300 ease-in-out',
          sidebarOpen
            ? 'w-full md:w-[calc(100%-16.75rem)] ml-0 md:ml-[16.75rem] translate-x-[16.5rem] md:translate-x-0'
            : 'w-full md:w-[calc(100%-4.25rem)] ml-0 md:ml-[4.25rem] translate-x-0',
        )}
      >
        <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
