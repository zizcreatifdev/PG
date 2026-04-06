import { CheckCircle2 } from 'lucide-react';

export default function Confirmation() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #03045E 0%, #023E8A 100%)' }}>
      <div className="max-w-md w-full text-center">
        <CheckCircle2 className="h-20 w-20 mx-auto mb-6" style={{ color: '#8FC500' }} />
        <h1 className="font-display text-3xl font-bold text-white mb-4">Votre contrat a bien été signé !</h1>
        <p className="text-white/70 text-base leading-relaxed">
          Nous revenons vers vous sous 24h pour finaliser votre inscription.
        </p>
        <p className="text-white/70 text-base mt-4">À très vite — L'équipe Persona Genius</p>
      </div>
    </div>
  );
}
