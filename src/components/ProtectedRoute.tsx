import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

type AppRole = 'admin' | 'staff' | 'client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground font-body text-sm">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!role || !allowedRoles.includes(role)) {
    // Redirect to the user's own dashboard based on their actual role
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'staff') return <Navigate to="/staff" replace />;
    if (role === 'client') return <Navigate to="/client" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
