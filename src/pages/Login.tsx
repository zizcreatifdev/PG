import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error('Identifiants incorrects');
      setIsLoading(false);
      return;
    }

    // Fetch role then redirect
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: role } = await supabase.rpc('get_user_role', { _user_id: user.id });
      switch (role) {
        case 'admin': navigate('/admin/dashboard', { replace: true }); break;
        case 'staff': navigate('/staff/dashboard', { replace: true }); break;
        case 'client': navigate('/client/dashboard', { replace: true }); break;
        default: navigate('/login', { replace: true });
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'linear-gradient(135deg, #03045E 0%, #023E8A 50%, #0077B6 100%)' }}>
      <div className="w-full max-w-md animate-fade-in px-6">
        <div className="mb-10 flex flex-col items-center">
          <img src="/logo-blanc.svg" alt="Persona Genius" className="mb-4 h-16" />
        </div>

        <div className="glass-card p-8">
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2 text-center">Connexion</h1>
          <p className="text-muted-foreground text-sm text-center mb-8">Accédez à votre espace Persona Genius</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-body text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-lg border-border bg-background/50 font-body"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-body text-sm font-medium">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-lg border-border bg-background/50 font-body"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-lg font-heading font-semibold text-base"
              style={{ backgroundColor: '#8FC500', color: '#fff' }}
            >
              {isLoading ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          © 2026 Persona Genius — Tous droits réservés
        </p>
      </div>
    </div>
  );
}
