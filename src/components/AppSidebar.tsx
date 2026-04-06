import {
  LayoutDashboard,
  Users,
  FileText,
  CalendarDays,
  Camera,
  Receipt,
  Globe,
  ClipboardList,
  Settings,
  LogOut,
  CheckCircle,
  User,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

type AppRole = 'admin' | 'staff' | 'client';

interface AppSidebarProps {
  role: AppRole | null;
  currentPath: string;
}

const adminLinks = [
  { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Clients', url: '/admin/clients', icon: Users },
  { title: 'Posts', url: '/admin/posts', icon: FileText },
  { title: 'Calendrier', url: '/admin/calendrier', icon: CalendarDays },
  { title: 'Shootings', url: '/admin/shootings', icon: Camera },
  { title: 'Contrats', url: '/admin/contrats', icon: FileText },
  { title: 'Comptabilité', url: '/admin/facturation', icon: Receipt },
  { title: 'Landing Page', url: '/admin/landing-page', icon: Globe },
  { title: 'Journal Staff', url: '/admin/journal', icon: ClipboardList },
  { title: 'Paramètres', url: '/admin/parametres', icon: Settings },
];

const staffLinks = [
  { title: 'Tableau de bord', url: '/staff/dashboard', icon: LayoutDashboard },
  { title: 'Clients', url: '/staff/clients', icon: Users },
  { title: 'Calendrier', url: '/staff/calendrier', icon: CalendarDays },
  { title: 'Analytics', url: '/staff/analytics', icon: FileText },
];

const clientLinks = [
  { title: 'Mes posts', url: '/client/dashboard', icon: FileText },
  { title: 'Mon calendrier', url: '/client/calendrier', icon: CalendarDays },
  { title: 'Déjà validés', url: '/client/valides', icon: CheckCircle },
  { title: 'Mon profil', url: '/client/profil', icon: User },
];

export function AppSidebar({ role, currentPath }: AppSidebarProps) {
  const { signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const links = role === 'admin' ? adminLinks : role === 'staff' ? staffLinks : clientLinks;

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border">
        <img src="/logo-blanc.svg" alt="PG" className="h-9 w-auto shrink-0" />
        {!collapsed && (
          <span className="font-heading text-[13px] font-bold uppercase tracking-[0.12em] text-sidebar-foreground">
            Persona Genius
          </span>
        )}
      </div>

      <SidebarContent className="pt-5 px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {links.map((item) => {
                const isActive = currentPath === item.url || currentPath.startsWith(item.url + '/');
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-body transition-all duration-150 ${
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-foreground font-medium shadow-sm'
                            : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                        }`}
                        activeClassName=""
                      >
                        <item.icon className="h-[18px] w-[18px] shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-body text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
