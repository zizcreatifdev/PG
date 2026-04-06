import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, AlertTriangle, Edit3, MessageSquare, Check } from 'lucide-react';
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
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'done'>('loading');
  const [invalidReason, setInvalidReason] = useState('');
  const [post, setPost] = useState<PostData | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [commentModal, setCommentModal] = useState(false);
  const [editText, setEditText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [doneMessage, setDoneMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setStatus('invalid'); setInvalidReason('Lien invalide'); return; }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/functions/v1/validate-post?token=${token}`, {
          headers: { 'apikey': API_KEY },
        });
        const data = await res.json();
        if (data.valid && data.post) {
          setPost(data.post);
          setEditText(data.post.contenu);
          setStatus('valid');
        } else {
          setStatus('invalid');
          setInvalidReason(data.reason || 'Lien invalide');
        }
      } catch {
        setStatus('invalid');
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
        if (action === 'approve') { setDoneMessage('Post approuvé avec succès !'); setStatus('done'); }
        else if (action === 'modify') { setDoneMessage('Vos modifications ont été envoyées.'); setStatus('done'); }
        else if (action === 'comment') { toast.success('Commentaire envoyé'); setCommentModal(false); setCommentText(''); }
      } else {
        toast.error(data.error || 'Erreur');
      }
    } catch { toast.error('Erreur de connexion'); }
    setSubmitting(false);
  };

  // Loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3F2EF' }}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600" />
      </div>
    );
  }

  // Invalid
  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F3F2EF' }}>
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 text-center" style={{ border: '1px solid #e0e0e0' }}>
          <AlertTriangle className="h-14 w-14 mx-auto mb-4" style={{ color: '#D97706' }} />
          <h1 className="text-xl font-semibold mb-2" style={{ color: 'rgba(0,0,0,0.9)', fontFamily: '-apple-system, system-ui, "Segoe UI", Roboto, sans-serif' }}>{invalidReason}</h1>
          <p className="text-sm" style={{ color: 'rgba(0,0,0,0.6)' }}>Contactez votre gestionnaire Persona Genius pour un nouveau lien.</p>
        </div>
      </div>
    );
  }

  // Done
  if (status === 'done') {
    return (
      <div className="min-h-screen flex items-center    justify-center px-4" style={{ backgroundColor: '#F3F2EF' }}>
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 text-center" style={{ border: '1px solid #e0e0e0' }}>
          <CheckCircle2 className="h-16 w-16 mx-auto mb-4" style={{ color: '#8FC500' }} />
          <h1 className="text-xl font-semibold mb-2" style={{ color: 'rgba(0,0,0,0.9)', fontFamily: '-apple-system, system-ui, "Segoe UI", Roboto, sans-serif' }}>{doneMessage}</h1>
          <p className="text-sm" style={{ color: 'rgba(0,0,0,0.6)' }}>Votre équipe Persona Genius a été notifiée.</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Valid — show LinkedIn preview + actions
  const client = post?.clients;

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#F3F2EF', fontFamily: '-apple-system, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <div className="max-w-[600px] mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'rgba(0,0,0,0.4)' }}>Validation de post</p>
          <p className="text-sm" style={{ color: 'rgba(0,0,0,0.6)' }}>
            Programmé le {new Date(post!.date_planifiee).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* LinkedIn Preview — exact style */}
        <div className="bg-white rounded-lg shadow-sm mb-6" style={{ border: '1px solid #e0e0e0' }}>
          {/* Post header */}
          <div className="flex items-start gap-2 p-4 pb-0">
            <div className="shrink-0 h-12 w-12 rounded-full overflow-hidden" style={{ backgroundColor: '#e0e0e0' }}>
              {client?.photo_url ? (
                <img src={client.photo_url} alt={client.nom} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-lg font-semibold" style={{ color: 'rgba(0,0,0,0.6)' }}>
                  {client?.nom?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold leading-5" style={{ color: 'rgba(0,0,0,0.9)' }}>{client?.nom || 'Client'}</p>
              <p className="text-xs leading-4" style={{ color: 'rgba(0,0,0,0.6)' }}>{client?.titre_professionnel || 'Membre LinkedIn'}</p>
              <p className="text-xs leading-4" style={{ color: 'rgba(0,0,0,0.6)' }}>Maintenant · 🌐</p>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-3">
            <p className="text-sm leading-5 whitespace-pre-wrap" style={{ color: 'rgba(0,0,0,0.9)' }}>{post!.contenu}</p>
          </div>

          {/* Media */}
          {post!.format === 'image' && post!.media_url && (
            <img src={post!.media_url} alt="" className="w-full object-cover" style={{ maxHeight: '400px' }} />
          )}
          {post!.format === 'video' && post!.media_url && (
            <video src={post!.media_url} controls className="w-full" style={{ maxHeight: '400px' }} />
          )}

          {/* Poll */}
          {post!.format === 'sondage' && post!.sondage_question && (
            <div className="px-4 pb-3">
              <p className="text-sm font-semibold mb-2" style={{ color: 'rgba(0,0,0,0.9)' }}>{post!.sondage_question}</p>
              <div className="space-y-2">
                {(post!.sondage_options || []).filter(Boolean).map((opt, i) => (
                  <div key={i} className="px-4 py-2.5 rounded-full text-sm" style={{ border: '1px solid #0a66c2', color: '#0a66c2' }}>{opt}</div>
                ))}
              </div>
            </div>
          )}

          {/* Engagement bar */}
          <div className="px-4 py-1.5 flex items-center justify-between text-xs" style={{ color: 'rgba(0,0,0,0.6)', borderBottom: '1px solid #e0e0e0' }}>
            <span>👍 ❤️ 12</span><span>3 commentaires</span>
          </div>
          <div className="flex items-center justify-around py-1">
            {['👍 J\'aime', '💬 Commenter', '🔁 Republier', '✈️ Envoyer'].map(a => (
              <div key={a} className="flex items-center gap-1.5 px-3 py-3 text-xs font-semibold" style={{ color: 'rgba(0,0,0,0.6)' }}>{a}</div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <button
            onClick={() => setEditModal(true)}
            className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl bg-white transition hover:shadow-md"
            style={{ border: '1px solid #e0e0e0' }}
          >
            <Edit3 className="h-5 w-5" style={{ color: '#BA7517' }} />
            <span className="text-xs font-semibold" style={{ color: 'rgba(0,0,0,0.8)' }}>Modifier le texte</span>
          </button>
          <button
            onClick={() => setCommentModal(true)}
            className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl bg-white transition hover:shadow-md"
            style={{ border: '1px solid #e0e0e0' }}
          >
            <MessageSquare className="h-5 w-5" style={{ color: '#0077B6' }} />
            <span className="text-xs font-semibold" style={{ color: 'rgba(0,0,0,0.8)' }}>Commenter</span>
          </button>
          <button
            onClick={() => doAction('approve')}
            disabled={submitting}
            className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl text-white transition hover:opacity-90"
            style={{ backgroundColor: '#8FC500' }}
          >
            <Check className="h-5 w-5" />
            <span className="text-xs font-semibold">Approuver ✓</span>
          </button>
        </div>

        <Footer />
      </div>

      {/* Edit Modal */}
      <Dialog open={editModal} onOpenChange={setEditModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle style={{ fontFamily: '-apple-system, system-ui, "Segoe UI", Roboto, sans-serif' }}>Modifier le texte</DialogTitle></DialogHeader>
          <Textarea value={editText} onChange={e => setEditText(e.target.value)} rows={8} className="mt-4" style={{ fontFamily: '-apple-system, system-ui, "Segoe UI", Roboto, sans-serif' }} />
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setEditModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={() => doAction('modify', { contenu: editText })} disabled={submitting} className="flex-1" style={{ backgroundColor: '#BA7517' }}>
              {submitting ? 'Envoi…' : 'Envoyer la modification'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comment Modal */}
      <Dialog open={commentModal} onOpenChange={setCommentModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle style={{ fontFamily: '-apple-system, system-ui, "Segoe UI", Roboto, sans-serif' }}>Laisser un commentaire</DialogTitle></DialogHeader>
          <Textarea value={commentText} onChange={e => setCommentText(e.target.value)} rows={4} className="mt-4" placeholder="Votre commentaire…" style={{ fontFamily: '-apple-system, system-ui, "Segoe UI", Roboto, sans-serif' }} />
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setCommentModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={() => doAction('comment', { comment: commentText })} disabled={submitting || !commentText.trim()} className="flex-1" style={{ backgroundColor: '#0077B6' }}>
              {submitting ? 'Envoi…' : 'Envoyer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Footer() {
  return (
    <div className="text-center py-6">
      <p className="text-[11px] uppercase tracking-wider" style={{ color: 'rgba(0,0,0,0.3)' }}>
        Powered by <span className="font-semibold">Persona Genius</span>
      </p>
    </div>
  );
}
