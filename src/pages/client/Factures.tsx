import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type Invoice = {
  id: string;
  numero: string;
  montant_xof: number;
  statut: 'en_attente' | 'payee' | 'en_retard';
  date_emission: string;
  date_echeance: string;
};

const statusColors: Record<string, string> = {
  en_attente: 'bg-accent/10 text-accent border-accent/20',
  payee: 'bg-success/10 text-success border-success/20',
  en_retard: 'bg-destructive/10 text-destructive border-destructive/20',
};
const statusLabels: Record<string, string> = { en_attente: 'En attente', payee: 'Payée', en_retard: 'En retard' };
const formatXOF = (n: number) => n.toLocaleString('fr-FR').replace(/\u202f/g, ' ').replace(/\u00a0/g, ' ') + ' XOF';

export default function ClientFactures() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data } = await supabase.from('invoices').select('id, numero, montant_xof, statut, date_emission, date_echeance').order('date_emission', { ascending: false });
      setInvoices((data as Invoice[]) || []);
    }
    load();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Mes factures</h1>
        <p className="text-muted-foreground font-body mt-1">Historique de facturation</p>
      </div>
      <div className="glass-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Émission</TableHead>
              <TableHead>Échéance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map(inv => (
              <TableRow key={inv.id}>
                <TableCell className="font-heading font-medium">{inv.numero}</TableCell>
                <TableCell className="font-heading font-semibold">{formatXOF(inv.montant_xof)}</TableCell>
                <TableCell><Badge variant="outline" className={statusColors[inv.statut]}>{statusLabels[inv.statut]}</Badge></TableCell>
                <TableCell>{new Date(inv.date_emission).toLocaleDateString('fr-FR')}</TableCell>
                <TableCell>{new Date(inv.date_echeance).toLocaleDateString('fr-FR')}</TableCell>
              </TableRow>
            ))}
            {invoices.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Aucune facture</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
