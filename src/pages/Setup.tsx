import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function Setup() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const run = async () => {
    setStatus('loading');
    try {
      // 1. Créer le compte admin (ou récupérer l'existant)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'admin@personagenius.sn',
        password: 'Admin2026!',
      });

      let userId: string | null = null;

      if (signUpError) {
        // Compte déjà existant — tenter de se connecter pour récupérer l'ID
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: 'admin@personagenius.sn',
          password: 'Admin2026!',
        });
        if (signInError) {
          setMessage(`Erreur : ${signInError.message}`);
          setStatus('error');
          return;
        }
        userId = signInData.user?.id ?? null;
        await supabase.auth.signOut();
      } else {
        userId = signUpData.user?.id ?? null;
      }

      if (!userId) {
        setMessage('Impossible de récupérer l\'ID utilisateur.');
        setStatus('error');
        return;
      }

      // 2. Insérer le rôle admin
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });

      if (roleError) {
        setMessage(`Compte créé mais erreur rôle : ${roleError.message}`);
        setStatus('error');
        return;
      }

      setMessage('✅ Compte admin créé ! Vous pouvez maintenant vous connecter.');
      setStatus('done');
    } catch (e: any) {
      setMessage(`Erreur inattendue : ${e.message}`);
      setStatus('error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #03045E, #0077B6)', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 40, maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
        <p style={{ fontSize: 32, marginBottom: 8 }}>⚙️</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#03045E', marginBottom: 8 }}>Setup — Compte Admin</h1>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
          Crée le compte <strong>admin@personagenius.sn</strong><br />avec le mot de passe <strong>Admin2026!</strong>
        </p>

        {status === 'idle' && (
          <button
            onClick={run}
            style={{ background: '#03045E', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', width: '100%' }}
          >
            Créer le compte admin
          </button>
        )}

        {status === 'loading' && (
          <p style={{ color: '#0077B6', fontWeight: 600 }}>Création en cours…</p>
        )}

        {status === 'done' && (
          <>
            <p style={{ color: '#1D9E75', fontWeight: 600, fontSize: 15, marginBottom: 16 }}>{message}</p>
            <a
              href="/login"
              style={{ display: 'inline-block', background: '#8FC500', color: '#fff', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 600, textDecoration: 'none', width: '100%', boxSizing: 'border-box' }}
            >
              Aller à la connexion →
            </a>
          </>
        )}

        {status === 'error' && (
          <>
            <p style={{ color: '#DC2626', fontWeight: 600, fontSize: 14, marginBottom: 16 }}>{message}</p>
            <button
              onClick={() => setStatus('idle')}
              style={{ background: '#f3f4f6', color: '#333', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}
            >
              Réessayer
            </button>
          </>
        )}
      </div>
    </div>
  );
}
