import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Edit3, MessageSquare, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInHours } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  propose: { label: 'Proposé', color: '#378ADD', bg: '#E6F1FB' },
  modifie: { label: 'Modifié', color: '#BA7517', bg: '#FAEEDA' },
  approuve: { label: 'Approuvé', color: '#E8533A', bg: '#FAECE7' },
  valide: { label: 'Validé', color: '#1D9E75', bg: '#EAF3DE' },
  poste: { label: 'Posté', color: '#03045E', bg: 'rgba(3,4,94,0.07)' },
};

type Post = {
  id: string;
  contenu: string;
  date_planifiee: string;
  statut: string;
  format: string;
  media_url: string | null;
  heure_publication: string | null;
  created_at: string;
};

export default function ClientDashboard() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);

  // Edit state
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [editContenu, setEditContenu] = useState('');

  // Comment state
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState('');

  // Approve state
  const [approvePost, setApprovePost] = useState<Post | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: clientData } = await supabase.from('clients').select('id').eq('user_id', user.id).single();
    if (!clientData) return;
    setClientId(clientData.id);

    const { data } = await supabase
      .from('posts')
      .select('id, contenu, date_planifiee, statut, format, media_url, heure_publication, created_at')
      .eq('client_id', clientData.id)
      .eq('statut', 'propose' as any)
      .order('date_planifiee');
    setPosts((data as Post[]) || []);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Urgent posts (proposed > 48h ago)
  const urgentPosts = posts.filter(p => {
    return differenceInHours(new Date(), new Date(p.created_at)) > 48;
  });

  // ── Edit (inline text only) ──
  const handleSaveEdit = async () => {
    if (!editPost) return;
    const { error } = await supabase.from('posts').update({ contenu: editContenu, statut: 'modifie' as any }).eq('id', editPost.id);
    if (error) { toast.error('Erreur'); return; }
    // Notify admin
    const { data: admins } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
    if (admins) {
      for (const a of admins) {
        await supabase.from('notifications').insert({
          user_id: a.user_id,
          title: 'Post modifié par le client',
          message: `Le client a modifié le contenu d'un post programmé le ${format(new Date(editPost.date_planifiee), 'd MMM yyyy', { locale: fr })}.`,
        });
      }
    }
    toast.success('Modifications enregistrées');
    setEditPost(null);
    load();
  };

  // ── Comment ──
  const handleSendComment = async () => {
    if (!commentPost || !commentText.trim()) return;
    const { data: admins } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
    if (admins) {
      for (const a of admins) {
        await supabase.from('notifications').insert({
          user_id: a.user_id,
          title: 'Commentaire client sur un post',
          message: `Commentaire sur le post du ${format(new Date(commentPost.date_planifiee), 'd MMM yyyy', { locale: fr })} : "${commentText}"`,
        });
      }
    }
    toast.success('Commentaire envoyé');
    setCommentPost(null);
    setCommentText('');
  };

  // ── Approve ──
  const handleApprove = async () => {
    if (!approvePost) return;
    const { error } = await supabase.from('posts').update({ statut: 'approuve' as any }).eq('id', approvePost.id);
    if (error) { toast.error('Erreur'); return; }
    const { data: admins } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
    if (admins) {
      for (const a of admins) {
        await supabase.from('notifications').insert({
          user_id: a.user_id,
          title: 'Post approuvé',
          message: `Le client a approuvé le post programmé le ${format(new Date(approvePost.date_planifiee), 'd MMM yyyy', { locale: fr })}.`,
        });
      }
    }
    toast.success('Post approuvé !');
    setApprovePost(null);
    load();
  };

  const scrollToPost = (postId: string) => {
    document.getElementById(`post-${postId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Mes posts</h1>
        <p className="text-muted-foreground font-body mt-1">Posts en attente de votre validation</p>
      </div>

      {/* Urgent banner */}
      {urgentPosts.length > 0 && (
        <div className="rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: '#FAEEDA', border: '1px solid #D9770640' }}>
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#D97706' }} />
          <div className="flex-1">
            <p className="font-heading font-semibold text-sm" style={{ color: '#D97706' }}>
              {urgentPosts.length} post(s) en attente depuis plus de 48h
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {urgentPosts.map(p => (
                <Button
                  key={p.id}
                  size="sm"
                  variant="outline"
                  className="text-xs font-heading"
                  style={{ borderColor: '#D97706', color: '#D97706' }}
                  onClick={() => scrollToPost(p.id)}
                >
                  {p.contenu.substring(0, 30)}... — Voir maintenant
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Posts list */}
      {posts.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="font-heading text-lg font-semibold text-foreground">Aucun post en attente</p>
          <p className="text-sm text-muted-foreground font-body mt-1">Tous vos posts ont été traités ✨</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => {
            const cfg = STATUS_CONFIG[post.statut] || STATUS_CONFIG.propose;
            const isUrgent = differenceInHours(new Date(), new Date(post.created_at)) > 48;
            return (
              <div
                key={post.id}
                id={`post-${post.id}`}
                className="glass-card p-5 space-y-4 transition-all"
                style={isUrgent ? { borderColor: '#D97706', borderWidth: '2px' } : {}}
              >
                {/* Top row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className="font-body text-xs border-0" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground font-body">
                      {format(new Date(post.date_planifiee), 'd MMMM yyyy', { locale: fr })}
                    </span>
                    {post.heure_publication && (
                      <span className="text-xs text-muted-foreground font-body">
                        à {format(new Date(post.heure_publication), 'HH:mm')}
                      </span>
                    )}
                  </div>
                  {isUrgent && (
                    <Badge className="font-body text-[10px] border-0 gap-1" style={{ backgroundColor: '#FAEEDA', color: '#D97706' }}>
                      <AlertTriangle className="h-3 w-3" /> Urgent
                    </Badge>
                  )}
                </div>

                {/* Content preview */}
                <div className="rounded-lg p-4 bg-muted/30">
                  <p className="font-body text-sm text-foreground whitespace-pre-wrap line-clamp-6">{post.contenu || 'Contenu du post...'}</p>
                </div>

                {post.media_url && (
                  <img src={post.media_url} alt="" className="rounded-lg max-h-48 object-cover" />
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-heading font-semibold gap-1.5"
                    onClick={() => { setEditPost(post); setEditContenu(post.contenu); }}
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-heading font-semibold gap-1.5"
                    onClick={() => setCommentPost(post)}
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Commenter
                  </Button>
                  <Button
                    size="sm"
                    className="font-heading font-semibold gap-1.5 text-white"
                    style={{ backgroundColor: '#1D9E75' }}
                    onClick={() => setApprovePost(post)}
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Approuver
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editPost} onOpenChange={o => { if (!o) setEditPost(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Modifier le contenu</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-xs text-muted-foreground font-body">
              Vous pouvez modifier le texte. Le format et les médias restent inchangés.
            </p>
            <Textarea
              value={editContenu}
              onChange={e => setEditContenu(e.target.value)}
              rows={8}
              className="font-body"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPost(null)}>Annuler</Button>
            <Button className="font-heading text-white" style={{ backgroundColor: '#03045E' }} onClick={handleSaveEdit}>
              Enregistrer les modifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comment dialog */}
      <Dialog open={!!commentPost} onOpenChange={o => { if (!o) { setCommentPost(null); setCommentText(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Ajouter un commentaire</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-xs text-muted-foreground font-body">
              Votre commentaire sera envoyé à votre gestionnaire de compte.
            </p>
            <Textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              rows={4}
              placeholder="Écrivez votre commentaire ici..."
              className="font-body"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCommentPost(null); setCommentText(''); }}>Annuler</Button>
            <Button className="font-heading text-white" style={{ backgroundColor: '#0077B6' }} onClick={handleSendComment} disabled={!commentText.trim()}>
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve confirmation */}
      <AlertDialog open={!!approvePost} onOpenChange={() => setApprovePost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Approuver ce post ?</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              Une fois approuvé, votre gestionnaire pourra programmer la publication définitive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-heading">Annuler</AlertDialogCancel>
            <AlertDialogAction className="font-heading text-white" style={{ backgroundColor: '#1D9E75' }} onClick={handleApprove}>
              Approuver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
