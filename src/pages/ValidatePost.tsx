import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, AlertTriangle, Edit3, X, Check } from 'lucide-react';
import { toast } from 'sonner';

type PostData = {
  id: string;
  contenu: string;
  date_planifiee: string;
  statut: string;
  format: string;
  media_url: string | null;
  sondage_question: string | null;
  sondage_options: string[] | null;
  clients: { nom: string; photo_url: string | null; titre_professionnel: string | null } | null;
};

const API_BASE = import.meta.env.VITE_SUPABASE_URL;
const API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function ValidatePost() {
  const { token } = useParams<{ token: string }>();
  const [pageStatus, setPageStatus] = useState<'loading' | 'valid' | 'invalid' | 'done'>('loading');
  const [invalidReason, setInvalidReason] = useState('');
  const [post, setPost] = useState<PostData | null>(null);
  const [doneMessage, setDoneMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modification form
  const [showModifForm, setShowModifForm] = useState(false);
  const [modifComment, setModifComment] = useState('');

  // Refuse confirm
  const [showRefuseConfirm, setShowRefuseConfirm] = useState(false);

  useEffect(() => {
    if (!token) { setPageStatus('invalid'); setInvalidReason('Lien invalide'); return; }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/functions/v1/validate-post?token=${token}`, {
          headers: { 'apikey': API_KEY },
        });
        const data = await res.json();
        if (data.valid && data.post) {
          setPost(data.post);
          setPageStatus('valid');
        } else {
          setPageStatus('invalid');
          setInvalidReason(data.reason || 'Lien invalide ou expiré');
        }
      } catch {
        setPageStatus('invalid');
        setInvalidReason('Erreur de connexion');
      }
    })();
  }, [token]);

  const doAction = async (action: string, payload: Record<string, string> = {}) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/functions/v1/validate-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': API_KEY },
        body: JSON.stringify({ token, action, ...payload }),
      });
      const data = await res.json();
      if (data.success) {
        if (action === 'validate') {
          setDoneMessage('Votre post a été validé avec succès !');
        } else if (action === 'request_modification') {
          setDoneMessage('Votre demande de modification a été envoyée.');
        } else if (action === 'refuse') {
          setDoneMessage('Votre réponse a été enregistrée.');
        }
        setPageStatus('done');
      } else {
        toast.error(data.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur de connexion');
    }
    setSubmitting(false);
  };

  // ── Loading ──
  if (pageStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3F2EF' }}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600" />
      </div>
    );
  }

  // ── Invalid ──
  if (pageStatus === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F3F2EF', fontFamily: '-apple-system, "Segoe UI", Roboto, sans-serif' }}>
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 text-center" style={{ border: '1px solid #e0e0e0' }}>
          <AlertTriangle className="h-14 w-14 mx-auto mb-4" style={{ color: '#D97706' }} />
          <h1 className="text-xl font-semibold mb-2" style={{ color: 'rgba(0,0,0,0.9)' }}>Lien invalide ou expiré</h1>
          <p className="text-sm mb-1" style={{ color: 'rgba(0,0,0,0.6)' }}>{invalidReason}</p>
          <p className="text-sm" style={{ color: 'rgba(0,0,0,0.5)' }}>Contactez votre gestionnaire PersonaGenius pour obtenir un nouveau lien.</p>
        </div>
      </div>
    );
  }

  // ── Done ──
  if (pageStatus === 'done') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#F3F2EF', fontFamily: '-apple-system, "Segoe UI", Roboto, sans-serif' }}>
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 text-center" style={{ border: '1px solid #e0e0e0' }}>
          <CheckCircle2 className="h-16 w-16 mx-auto mb-4" style={{ color: '#8FC500' }} />
          <h1 className="text-xl font-semibold mb-2" style={{ color: 'rgba(0,0,0,0.9)' }}>Merci !</h1>
          <p className="text-base font-medium mb-1" style={{ color: 'rgba(0,0,0,0.8)' }}>{doneMessage}</p>
          <p className="text-sm" style={{ color: 'rgba(0,0,0,0.5)' }}>Votre réponse a été enregistrée. Votre équipe PersonaGenius a été notifiée.</p>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Valid — LinkedIn preview + 3 actions ──
  const client = post?.clients;

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: '#F3F2EF', fontFamily: '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
    >
      <div className="max-w-[600px] mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(0,0,0,0.4)' }}>
            PersonaGenius · Validation de post
          </p>
          <p className="text-sm" style={{ color: 'rgba(0,0,0,0.6)' }}>
            Programmé le{' '}
            {new Date(post!.date_planifiee).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>

        {/* ── LinkedIn Preview (fond blanc strict, zéro glassmorphisme) ── */}
        <div
          className="mb-6"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}
        >
          {/* Post header */}
          <div className="flex items-start gap-2 p-4 pb-2">
            <div
              className="shrink-0 rounded-full overflow-hidden"
              style={{ width: 48, height: 48, backgroundColor: '#e0e0e0' }}
            >
              {client?.photo_url ? (
                <img src={client.photo_url} alt={client.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div
                  style={{
                    width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 18, fontWeight: 600, color: 'rgba(0,0,0,0.6)',
                  }}
                >
                  {client?.nom?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, lineHeight: '20px', color: 'rgba(0,0,0,0.9)' }}>
                {client?.nom || 'Client'}
              </p>
              <p style={{ margin: 0, fontSize: 12, lineHeight: '16px', color: 'rgba(0,0,0,0.6)' }}>
                {client?.titre_professionnel || 'Membre LinkedIn'}
              </p>
              <p style={{ margin: 0, fontSize: 12, lineHeight: '16px', color: 'rgba(0,0,0,0.6)' }}>
                Maintenant · 🌐
              </p>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '8px 16px 12px' }}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: '20px', color: 'rgba(0,0,0,0.9)', whiteSpace: 'pre-wrap' }}>
              {post!.contenu}
            </p>
          </div>

          {/* Media */}
          {post!.format === 'image' && post!.media_url && (
            <img src={post!.media_url} alt="" style={{ width: '100%', objectFit: 'cover', maxHeight: 400, display: 'block' }} />
          )}
          {post!.format === 'video' && post!.media_url && (
            <video src={post!.media_url} controls style={{ width: '100%', maxHeight: 400, display: 'block' }} />
          )}

          {/* Poll */}
          {post!.format === 'sondage' && post!.sondage_question && (
            <div style={{ padding: '0 16px 12px' }}>
              <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.9)' }}>
                {post!.sondage_question}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(post!.sondage_options || []).filter(Boolean).map((opt, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '10px 16px', borderRadius: 24, fontSize: 14,
                      border: '1px solid #0a66c2', color: '#0a66c2',
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Engagement bar */}
          <div
            style={{
              padding: '6px 16px', display: 'flex', justifyContent: 'space-between',
              fontSize: 12, color: 'rgba(0,0,0,0.6)', borderTop: '1px solid #e0e0e0',
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            <span>👍 ❤️ 12</span>
            <span>3 commentaires</span>
          </div>

          {/* Reactions */}
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '2px 0' }}>
            {["👍 J'aime", '💬 Commenter', '🔁 Republier', '✈️ Envoyer'].map(a => (
              <div
                key={a}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px',
                  fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.6)',
                }}
              >
                {a}
              </div>
            ))}
          </div>
        </div>

        {/* ── 3 boutons d'action ── */}
        {!showModifForm && !showRefuseConfirm && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {/* ✅ Valider */}
            <button
              onClick={() => doAction('validate')}
              disabled={submitting}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                padding: '16px 8px', borderRadius: 12, border: 'none',
                backgroundColor: '#8FC500', color: '#ffffff', cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1, fontFamily: 'inherit',
              }}
            >
              <Check size={20} />
              <span style={{ fontSize: 12, fontWeight: 600, textAlign: 'center' }}>Valider ce post</span>
            </button>

            {/* ✏️ Demander une modification */}
            <button
              onClick={() => setShowModifForm(true)}
              disabled={submitting}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                padding: '16px 8px', borderRadius: 12, border: '1px solid #e0e0e0',
                backgroundColor: '#ffffff', color: '#BA7517', cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Edit3 size={20} />
              <span style={{ fontSize: 12, fontWeight: 600, textAlign: 'center', color: 'rgba(0,0,0,0.8)' }}>
                Demander une modification
              </span>
            </button>

            {/* ❌ Refuser */}
            <button
              onClick={() => setShowRefuseConfirm(true)}
              disabled={submitting}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                padding: '16px 8px', borderRadius: 12, border: '1px solid #e0e0e0',
                backgroundColor: '#ffffff', color: '#DC2626', cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <X size={20} />
              <span style={{ fontSize: 12, fontWeight: 600, textAlign: 'center', color: 'rgba(0,0,0,0.8)' }}>
                Refuser
              </span>
            </button>
          </div>
        )}

        {/* ── Formulaire demande de modification ── */}
        {showModifForm && (
          <div
            className="mb-6"
            style={{
              backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e0e0e0',
              padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: 'rgba(0,0,0,0.9)' }}>
              ✏️ Demander une modification
            </p>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'rgba(0,0,0,0.5)' }}>
              Décrivez les modifications souhaitées. Votre équipe en sera informée.
            </p>
            <Textarea
              value={modifComment}
              onChange={e => setModifComment(e.target.value)}
              rows={4}
              placeholder="Ex : Modifier le ton, corriger une faute, changer la structure..."
              style={{ fontFamily: 'inherit', fontSize: 14 }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <Button
                variant="outline"
                onClick={() => { setShowModifForm(false); setModifComment(''); }}
                style={{ flex: 1, fontFamily: 'inherit' }}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button
                onClick={() => doAction('request_modification', { commentaire: modifComment })}
                disabled={submitting || !modifComment.trim()}
                style={{ flex: 1, backgroundColor: '#BA7517', color: '#fff', fontFamily: 'inherit' }}
              >
                {submitting ? 'Envoi…' : 'Envoyer la demande'}
              </Button>
            </div>
          </div>
        )}

        {/* ── Confirmation refus ── */}
        {showRefuseConfirm && (
          <div
            className="mb-6"
            style={{
              backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #FECACA',
              padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#DC2626' }}>
              ❌ Confirmer le refus
            </p>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'rgba(0,0,0,0.6)' }}>
              Ce post sera repassé en brouillon. Votre équipe sera notifiée.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button
                variant="outline"
                onClick={() => setShowRefuseConfirm(false)}
                style={{ flex: 1, fontFamily: 'inherit' }}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button
                onClick={() => doAction('refuse')}
                disabled={submitting}
                style={{ flex: 1, backgroundColor: '#DC2626', color: '#fff', fontFamily: 'inherit' }}
              >
                {submitting ? 'Envoi…' : 'Confirmer le refus'}
              </Button>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div style={{ textAlign: 'center', paddingTop: 24, paddingBottom: 16 }}>
      <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(0,0,0,0.3)', fontFamily: 'inherit' }}>
        Powered by <strong>PersonaGenius</strong>
      </p>
    </div>
  );
}
