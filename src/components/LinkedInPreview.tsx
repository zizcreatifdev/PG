import { X } from 'lucide-react';

interface LinkedInPreviewProps {
  nom: string;
  titre: string;
  photoUrl?: string | null;
  contenu: string;
  mediaUrl?: string | null;
  format: string;
  sondageQuestion?: string | null;
  sondageOptions?: string[] | null;
  onClose: () => void;
}

export default function LinkedInPreview({
  nom, titre, photoUrl, contenu, mediaUrl, format: postFormat,
  sondageQuestion, sondageOptions, onClose,
}: LinkedInPreviewProps) {
  return (
    <div className="relative flex items-center justify-center">
      <button onClick={onClose} className="absolute -top-10 right-0 p-2 rounded-full hover:bg-black/10 transition">
        <X className="h-6 w-6" style={{ color: 'rgba(0,0,0,0.6)' }} />
      </button>

      <div className="w-full max-w-[552px] mx-4" style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        fontFamily: '-apple-system, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}>
        {/* Header */}
        <div className="flex items-start gap-2 p-4 pb-0">
          <div className="shrink-0 h-12 w-12 rounded-full overflow-hidden" style={{ backgroundColor: '#e0e0e0' }}>
            {photoUrl ? (
              <img src={photoUrl} alt={nom} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-lg font-semibold" style={{ color: 'rgba(0,0,0,0.6)' }}>
                {nom.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-5 truncate" style={{ color: 'rgba(0,0,0,0.9)' }}>{nom}</p>
            <p className="text-xs leading-4 truncate" style={{ color: 'rgba(0,0,0,0.6)' }}>{titre || 'Membre LinkedIn'}</p>
            <p className="text-xs leading-4" style={{ color: 'rgba(0,0,0,0.6)' }}>Maintenant · 🌐</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <p className="text-sm leading-5 whitespace-pre-wrap" style={{ color: 'rgba(0,0,0,0.9)' }}>
            {contenu || 'Contenu du post...'}
          </p>
        </div>

        {/* Media */}
        {postFormat === 'image' && mediaUrl && (
          <div className="w-full">
            <img src={mediaUrl} alt="Post" className="w-full object-cover" style={{ maxHeight: '400px' }} />
          </div>
        )}
        {postFormat === 'video' && mediaUrl && (
          <div className="w-full bg-black">
            <video src={mediaUrl} controls className="w-full" style={{ maxHeight: '400px' }} />
          </div>
        )}

        {/* Poll */}
        {postFormat === 'sondage' && sondageQuestion && (
          <div className="px-4 pb-3">
            <p className="text-sm font-semibold mb-2" style={{ color: 'rgba(0,0,0,0.9)' }}>{sondageQuestion}</p>
            <div className="space-y-2">
              {(sondageOptions || []).filter(Boolean).map((opt, i) => (
                <button key={i} className="w-full text-left px-4 py-2.5 rounded-full text-sm font-medium transition-colors" style={{
                  border: '1px solid #0a66c2',
                  color: '#0a66c2',
                }}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Engagement stats */}
        <div className="px-4 py-1.5 flex items-center justify-between text-xs" style={{ color: 'rgba(0,0,0,0.6)', borderBottom: '1px solid #e0e0e0' }}>
          <span>👍 ❤️ 12</span>
          <span>3 commentaires</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-around py-1">
          {[
            { icon: '👍', label: "J'aime" },
            { icon: '💬', label: 'Commenter' },
            { icon: '🔁', label: 'Republier' },
            { icon: '✈️', label: 'Envoyer' },
          ].map(action => (
            <button key={action.label} className="flex items-center gap-1.5 px-3 py-3 rounded transition-colors hover:bg-black/5">
              <span className="text-base">{action.icon}</span>
              <span className="text-xs font-semibold" style={{ color: 'rgba(0,0,0,0.6)' }}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
