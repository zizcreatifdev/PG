import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Eraser } from 'lucide-react';

const formatXOF = (n: number) => n.toLocaleString('fr-FR').replace(/\u202f/g, ' ').replace(/\u00a0/g, ' ');

export default function ContratSignature() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<any>(null);
  const [contractText, setContractText] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (!submissionId) return;
    (async () => {
      const { data: sub } = await supabase.from('prospect_submissions').select('*').eq('id', submissionId).single();
      if (!sub) { setLoading(false); return; }
      setSubmission(sub);

      // Determine contract type from formule
      let contractType = 'SOLO';
      if (sub.formule_id) {
        const { data: formule } = await supabase.from('formules').select('contract_type, contract_template, prix_xof, nom').eq('id', sub.formule_id).single();
        if (formule) {
          contractType = formule.contract_type;
          if (contractType === 'CUSTOM' && formule.contract_template) {
            setContractText(replaceVars(formule.contract_template, sub, formule));
            setLoading(false);
            return;
          }
        }
      }

      const { data: tpl } = await supabase.from('contract_templates').select('contenu').eq('type', contractType).single();
      if (tpl?.contenu) {
        const formuleData = sub.formule_id
          ? (await supabase.from('formules').select('prix_xof, nom').eq('id', sub.formule_id).single()).data
          : null;
        setContractText(replaceVars(tpl.contenu, sub, formuleData));
      }
      setLoading(false);
    })();
  }, [submissionId]);

  function replaceVars(text: string, sub: any, formule: any) {
    const now = new Date();
    const debut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const fmtDate = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    return text
      .replace(/\{CLIENT_NOM\}/g, `${sub.prenom} ${sub.nom}`)
      .replace(/\{CLIENT_PROFESSION\}/g, sub.profession)
      .replace(/\{CLIENT_EMAIL\}/g, sub.email)
      .replace(/\{FORMULE_NOM\}/g, formule?.nom || sub.formule_name || 'Solo')
      .replace(/\{FORMULE_MONTANT\}/g, formule?.prix_xof ? `${formatXOF(formule.prix_xof)} FCFA` : '100 000 FCFA')
      .replace(/\{DATE_SIGNATURE\}/g, fmtDate(now))
      .replace(/\{DATE_DEBUT\}/g, fmtDate(debut));
  }

  // Canvas drawing
  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  }, []);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, [getPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#03045E';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSigned(true);
  }, [isDrawing, getPos]);

  const stopDraw = useCallback(() => setIsDrawing(false), []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleSign = async () => {
    if (!hasSigned || !accepted || !canvasRef.current) return;
    setSubmitting(true);
    try {
      const signatureImage = canvasRef.current.toDataURL('image/png');
      const { error } = await supabase.from('prospect_submissions')
        .update({ signature_image: signatureImage, signed_at: new Date().toISOString(), status: 'signed' as any })
        .eq('id', submissionId!);
      if (error) throw error;

      // Notify admin (best effort — may fail if not authenticated)
      try {
        const { data: admins } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
        if (admins) {
          for (const admin of admins) {
            await supabase.from('notifications').insert({
              user_id: admin.user_id,
              title: '🖊 Nouveau contrat signé',
              message: `${submission.prenom} ${submission.nom} a signé le contrat (${submission.formule_name})`,
            });
          }
        }
      } catch { /* ignore notification errors for anonymous users */ }

      navigate('/confirmation');
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
    </div>
  );

  if (!submission) return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Soumission introuvable</h1>
        <p className="text-muted-foreground">Ce lien n'est plus valide.</p>
      </div>
    </div>
  );

  if (submission.status !== 'en_attente') return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Contrat déjà signé</h1>
        <p className="text-muted-foreground">Ce contrat a déjà été traité.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <img src="/logo-couleur.svg" alt="PG" className="h-8" />
          <span className="font-display text-sm font-bold tracking-wide uppercase" style={{ color: '#03045E' }}>Persona Genius</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Contract text */}
          <div className="lg:w-[60%]">
            <div className="rounded-xl p-6 sm:p-8 bg-white border-2 max-h-[80vh] overflow-y-auto" style={{ borderColor: '#03045E' }}>
              <h2 className="font-display text-xl font-bold mb-6" style={{ color: '#03045E' }}>
                Contrat de Prestation de Services — Personal Branding
              </h2>
              <div className="whitespace-pre-wrap text-[13px] leading-[1.8]" >
                {contractText}
              </div>
            </div>
          </div>

          {/* Right: Signature panel */}
          <div className="lg:w-[40%]">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Summary */}
              <div className="rounded-xl p-6 bg-white border border-border">
                <h3 className="font-display text-lg font-bold mb-4" style={{ color: '#03045E' }}>Récapitulatif</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Nom</span><span className="font-medium">{submission.prenom} {submission.nom}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Formule</span><span className="font-medium">{submission.formule_name}</span></div>
                </div>
              </div>

              {/* Signature canvas */}
              <div className="rounded-xl p-6 bg-white border border-border">
                <h3 className="font-display text-lg font-bold mb-2" style={{ color: '#03045E' }}>Signature</h3>
                <p className="text-xs text-muted-foreground mb-4">Signez dans le cadre ci-dessous avec votre souris ou votre doigt</p>
                <div className="border-2 border-dashed border-border rounded-lg mb-3 bg-muted/20">
                  <canvas
                    ref={canvasRef}
                    width={380}
                    height={160}
                    className="w-full cursor-crosshair touch-none"
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={stopDraw}
                  />
                </div>
                <button onClick={clearCanvas} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
                  <Eraser className="h-4 w-4" /> Effacer
                </button>
              </div>

              {/* Accept & Sign */}
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} className="mt-0.5" />
                <span className="text-sm text-muted-foreground">J'ai lu et j'accepte les termes du contrat</span>
              </label>

              <button
                onClick={handleSign}
                disabled={!hasSigned || !accepted || submitting}
                className="w-full py-4 rounded-xl font-display font-bold text-base transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#8FC500', color: '#03045E' }}
              >
                {submitting ? 'Envoi en cours…' : 'Signer et envoyer →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
