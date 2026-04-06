import { useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Menu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import NotificationBell from '@/components/NotificationBell';

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  staff: 'Staff',
  client: 'Client',
};

export default function DashboardLayout() {
  const { role, user } = useAuth();
  const location = useLocation();

  const prenom = user?.user_metadata?.prenom || user?.email?.split('@')[0] || '';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar role={role} currentPath={location.pathname} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 sm:h-16 flex items-center justify-between border-b border-border bg-card/60 backdrop-blur-md px-3 sm:px-4 md:px-8 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-foreground hover:bg-muted rounded-lg p-2 transition-colors">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <span className="text-sm font-body font-medium text-foreground hidden sm:inline">{prenom}</span>
              {role && (
                <Badge
                  variant="outline"
                  className="font-heading text-[11px] font-semibold uppercase tracking-wider border-border"
                  style={role === 'admin' ? { backgroundColor: '#03045E10', color: '#03045E', borderColor: '#03045E30' } : {}}
                >
                  {roleLabels[role]}
                </Badge>
              )}
              <div className="h-9 w-9 rounded-full flex items-center justify-center font-heading text-sm font-bold text-primary-foreground" style={{ backgroundColor: '#03045E' }}>
                {prenom.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          </header>
          <main className="flex-1 p-3 sm:p-5 md:p-8 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
