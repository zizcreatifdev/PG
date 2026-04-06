import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Send, FileDown, TrendingUp, TrendingDown, AlertTriangle, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Document, Page as PdfPage, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';

type Formule = { id: string; nom: string; prix_xof: number; features: string[]; description: string };
type Client = {
  id: string; nom: string; formule: string | null; montant_mensuel_xof: number | null;
  statut_paiement: string | null; photo_url: string | null;
  email: string | null; whatsapp: string | null; titre_professionnel: string | null;
};
type Payment = {
  id: string; client_id: string; montant_xof: number; date_paiement: string;
  methode: string | null; notes: string | null; reference: string | null;
};
type Expense = {
  id: string; categorie: string; montant_xof: number; date_depense: string; description: string;
};
type Invoice = {
  id: string; numero: string; client_id: string; montant_xof: number;
  statut: string; date_emission: string; date_echeance: string;
  clients?: { nom: string } | null;
};

const formatXOF = (n: number) => n.toLocaleString('fr-FR').replace(/\u202f/g, ' ').replace(/\u00a0/g, ' ') + ' XOF';
const paymentStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  paye: { label: 'Payé', color: '#16A34A', bg: '#F0FDF4' },
  partiel: { label: 'Partiel', color: '#D97706', bg: '#FFFBEB' },
  en_retard: { label: 'En retard', color: '#DC2626', bg: '#FEF2F2' },
  en_attente: { label: 'En attente', color: '#6B7280', bg: '#F3F4F6' },
};
const expenseCategories = ['Salaires', 'Shooting', 'Logiciels', 'Marketing', 'Autre'];
const DONUT_COLORS = ['#03045E', '#023E8A', '#0077B6', '#8FC500', '#D97706'];

// PDF Invoice - Premium Persona Genius Design
const NAVY = '#03045E';
const GREEN = '#8FC500';
const GRAY_TEXT = '#6B7280';
const GRAY_BORDER = '#E5E7EB';
const BLUE_PALE = '#F8FAFF';
const BLUE_BORDER = '#EEF2FF';

const statusPillColors: Record<string, { text: string; bg: string; border: string }> = {
  PAYE: { text: '#1D9E75', bg: '#ECFDF5', border: '#1D9E75' },
  EN_ATTENTE: { text: '#D97706', bg: '#FFFBEB', border: '#D97706' },
  PARTIEL: { text: '#0077B6', bg: '#E0F2FE', border: '#0077B6' },
  EN_RETARD: { text: '#DC2626', bg: '#FEF2F2', border: '#DC2626' },
};
const statusLabels: Record<string, string> = {
  PAYE: 'PAYÉ', EN_ATTENTE: 'EN ATTENTE', PARTIEL: 'PARTIEL', EN_RETARD: 'EN RETARD',
};

const pdfS = StyleSheet.create({
  page: { padding: 0, fontFamily: 'Helvetica', fontSize: 10, backgroundColor: '#FFFFFF' },
  // Top decorative band
  topBand: { flexDirection: 'row', height: 6 },
  bandGreen: { width: '30%', backgroundColor: GREEN },
  bandNavy: { width: '70%', backgroundColor: NAVY },
  // Header
  header: { paddingHorizontal: 40, paddingTop: 32, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  logoBlock: {},
  logoLine: { flexDirection: 'row' },
  logoPersona: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: NAVY, letterSpacing: 3 },
  logoGenius: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: GREEN, letterSpacing: 3 },
  logoSub: { fontSize: 8, color: GREEN, letterSpacing: 1, marginTop: 6 },
  headerRight: { alignItems: 'flex-end' },
  factureTitle: { fontSize: 42, fontFamily: 'Helvetica-Bold', color: NAVY, letterSpacing: 4 },
  greenLine: { height: 3, backgroundColor: GREEN, width: '100%', marginVertical: 6 },
  factureNum: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 6 },
  statusPill: { borderRadius: 12, paddingVertical: 4, paddingHorizontal: 14, borderWidth: 1 },
  statusPillText: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  // Dates band
  datesBand: { backgroundColor: NAVY, paddingVertical: 16, paddingHorizontal: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateBlock: { width: '30%' },
  dateSep: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  dateLabel: { fontSize: 8, fontFamily: 'Helvetica', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, marginBottom: 4 },
  dateValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  // Addresses
  addressRow: { paddingHorizontal: 40, paddingVertical: 28, flexDirection: 'row', justifyContent: 'space-between' },
  addressCard: { width: '47%', borderWidth: 1, borderColor: GRAY_BORDER, borderRadius: 6, padding: 16 },
  addressLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 2, marginBottom: 4 },
  addressAccent: { height: 2, width: 24, marginBottom: 8 },
  addressName: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 4 },
  addressLine: { fontSize: 10, color: GRAY_TEXT, marginTop: 2 },
  addressLink: { fontSize: 10, color: '#0077B6', marginTop: 2 },
  // Table
  tableWrap: { paddingHorizontal: 40 },
  tableHead: { flexDirection: 'row', backgroundColor: NAVY, borderRadius: 8, paddingVertical: 11, paddingHorizontal: 16 },
  thText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', letterSpacing: 1 },
  tdDesc: { width: '50%' },
  tdPeriod: { width: '18%', textAlign: 'center' },
  tdQty: { width: '10%', textAlign: 'center' },
  tdAmount: { width: '22%', textAlign: 'right' },
  tableRowEven: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: BLUE_BORDER },
  tableRowOdd: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: BLUE_BORDER, backgroundColor: BLUE_PALE },
  tdText: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: NAVY },
  tdSub: { fontSize: 9, color: GRAY_TEXT, marginTop: 4 },
  tdNormal: { fontSize: 10, color: NAVY },
  tdBoldAmt: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: NAVY },
  tdGreen: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: GREEN },
  // Total
  totalWrap: { paddingHorizontal: 40, marginTop: 20, alignItems: 'flex-end' },
  totalCard: { width: 260, borderWidth: 1, borderColor: GRAY_BORDER, borderRadius: 8, overflow: 'hidden' },
  totalSubLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 16 },
  totalSep: { height: 1, backgroundColor: GRAY_BORDER },
  totalMainLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: NAVY },
  totalLabelSm: { fontSize: 10, color: GRAY_TEXT },
  totalValueSm: { fontSize: 10, color: GRAY_TEXT },
  totalLabelLg: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  totalValueLg: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: GREEN },
  partialLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#FFF9F0' },
  partialLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#D97706' },
  partialValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#D97706' },
  acompteGreen: { fontSize: 10, color: '#1D9E75' },
  // Terms
  termsSection: { backgroundColor: BLUE_PALE, paddingVertical: 20, paddingHorizontal: 40, flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  termsBlock: { width: '47%' },
  termsLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5, marginBottom: 8 },
  termsText: { fontSize: 10, color: GRAY_TEXT, marginTop: 3 },
  termsGreen: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1D9E75', marginTop: 3 },
  // Decorative sep
  decoSep: { height: 1, backgroundColor: BLUE_BORDER },
  // Footer
  footer: { position: 'absolute', bottom: 6, left: 0, right: 0, backgroundColor: NAVY, paddingVertical: 16, paddingHorizontal: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLeft: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  footerCenter: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: GREEN },
  footerRight: { fontSize: 9, color: 'rgba(255,255,255,0.6)' },
  // Bottom band
  bottomBand: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', height: 6 },
});

type InvoicePdfData = {
  invoiceNumber: string;
  emissionDate: Date;
  dueDate: Date;
  status: 'PAYE' | 'EN_ATTENTE' | 'PARTIEL' | 'EN_RETARD';
  clientNom: string;
  clientProfession: string;
  clientEmail: string;
  clientWhatsapp: string;
  formuleName: string;
  formuleFeatures: string[];
  montantXOF: number;
  periode: string;
  acompteRecu?: number;
  datePaiement?: Date;
  shooting?: { type: string; date: Date; nbPhotos: number };
};

const formatDateFr = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

const InvoicePdf = ({ data }: { data: InvoicePdfData }) => {
  const pill = statusPillColors[data.status] || statusPillColors.EN_ATTENTE;
  const solde = data.acompteRecu ? data.montantXOF - data.acompteRecu : 0;
  const isDue = data.dueDate < new Date() && data.status !== 'PAYE';

  return (
    <Document>
      <PdfPage size="A4" style={pdfS.page}>
        {/* Top decorative band */}
        <View style={pdfS.topBand}>
          <View style={pdfS.bandGreen} />
          <View style={pdfS.bandNavy} />
        </View>

        {/* Header */}
        <View style={pdfS.header}>
          <View style={pdfS.logoBlock}>
            <View style={pdfS.logoLine}>
              <Text style={pdfS.logoPersona}>PERSONA </Text>
              <Text style={pdfS.logoGenius}>GENIUS</Text>
            </View>
            <Text style={pdfS.logoSub}>Agence de Personal Branding LinkedIn</Text>
          </View>
          <View style={pdfS.headerRight}>
            <Text style={pdfS.factureTitle}>FACTURE</Text>
            <View style={pdfS.greenLine} />
            <Text style={pdfS.factureNum}>N° {data.invoiceNumber}</Text>
            <View style={[pdfS.statusPill, { backgroundColor: pill.bg, borderColor: pill.border }]}>
              <Text style={[pdfS.statusPillText, { color: pill.text }]}>{statusLabels[data.status]}</Text>
            </View>
          </View>
        </View>

        {/* Dates band */}
        <View style={pdfS.datesBand}>
          <View style={pdfS.dateBlock}>
            <Text style={pdfS.dateLabel}>DATE D'ÉMISSION</Text>
            <Text style={pdfS.dateValue}>{formatDateFr(data.emissionDate)}</Text>
          </View>
          <View style={pdfS.dateSep} />
          <View style={[pdfS.dateBlock, { alignItems: 'center' as const }]}>
            <Text style={pdfS.dateLabel}>DATE D'ÉCHÉANCE</Text>
            <Text style={[pdfS.dateValue, isDue ? { color: '#FF6B6B' } : {}]}>{formatDateFr(data.dueDate)}</Text>
          </View>
          <View style={pdfS.dateSep} />
          <View style={[pdfS.dateBlock, { alignItems: 'flex-end' as const }]}>
            <Text style={pdfS.dateLabel}>RÉFÉRENCE CLIENT</Text>
            <Text style={pdfS.dateValue}>{data.clientNom}</Text>
          </View>
        </View>

        {/* Addresses */}
        <View style={pdfS.addressRow}>
          <View style={pdfS.addressCard}>
            <Text style={[pdfS.addressLabel, { color: GREEN }]}>ÉMETTEUR</Text>
            <View style={[pdfS.addressAccent, { backgroundColor: GREEN }]} />
            <Text style={pdfS.addressName}>Persona Genius</Text>
            <Text style={pdfS.addressLine}>Label des Créatifs SN</Text>
            <Text style={pdfS.addressLine}>Cité Marguery Derklé, Dakar</Text>
            <Text style={pdfS.addressLink}>hello@abdoulazizfall.com</Text>
          </View>
          <View style={pdfS.addressCard}>
            <Text style={[pdfS.addressLabel, { color: NAVY }]}>FACTURÉ À</Text>
            <View style={[pdfS.addressAccent, { backgroundColor: NAVY }]} />
            <Text style={pdfS.addressName}>{data.clientNom}</Text>
            {data.clientProfession ? <Text style={pdfS.addressLine}>{data.clientProfession}</Text> : null}
            {data.clientEmail ? <Text style={pdfS.addressLink}>{data.clientEmail}</Text> : null}
            {data.clientWhatsapp ? <Text style={pdfS.addressLine}>{data.clientWhatsapp}</Text> : null}
          </View>
        </View>

        {/* Table */}
        <View style={pdfS.tableWrap}>
          <View style={pdfS.tableHead}>
            <Text style={[pdfS.thText, pdfS.tdDesc]}>DESCRIPTION</Text>
            <Text style={[pdfS.thText, pdfS.tdPeriod]}>PÉRIODE</Text>
            <Text style={[pdfS.thText, pdfS.tdQty]}>QTÉ</Text>
            <Text style={[pdfS.thText, pdfS.tdAmount]}>MONTANT</Text>
          </View>
          <View style={pdfS.tableRowEven}>
            <View style={pdfS.tdDesc}>
              <Text style={pdfS.tdText}>Prestation Personal Branding — Formule {data.formuleName}</Text>
              {data.formuleFeatures.length > 0 && (
                <Text style={pdfS.tdSub}>{data.formuleFeatures.join(' · ')}</Text>
              )}
            </View>
            <Text style={[pdfS.tdPeriod, pdfS.tdNormal]}>{data.periode}</Text>
            <Text style={[pdfS.tdQty, pdfS.tdText]}>1</Text>
            <Text style={[pdfS.tdAmount, pdfS.tdBoldAmt]}>{formatXOF(data.montantXOF)}</Text>
          </View>
          {data.shooting && (
            <View style={pdfS.tableRowOdd}>
              <View style={pdfS.tdDesc}>
                <Text style={pdfS.tdText}>Shooting photo — {data.shooting.type}</Text>
                <Text style={pdfS.tdSub}>Session {formatDateFr(data.shooting.date)} · {data.shooting.nbPhotos} photos</Text>
              </View>
              <Text style={[pdfS.tdPeriod, pdfS.tdNormal]}>{data.periode}</Text>
              <Text style={[pdfS.tdQty, pdfS.tdText]}>1</Text>
              <Text style={[pdfS.tdAmount, pdfS.tdGreen]}>Inclus</Text>
            </View>
          )}
        </View>

        {/* Total */}
        <View style={pdfS.totalWrap}>
          <View style={pdfS.totalCard}>
            <View style={pdfS.totalSubLine}>
              <Text style={pdfS.totalLabelSm}>Sous-total</Text>
              <Text style={pdfS.totalValueSm}>{formatXOF(data.montantXOF)}</Text>
            </View>
            <View style={pdfS.totalSep} />
            <View style={pdfS.totalMainLine}>
              <Text style={pdfS.totalLabelLg}>TOTAL À PAYER</Text>
              <Text style={pdfS.totalValueLg}>{formatXOF(data.montantXOF)}</Text>
            </View>
            {data.status === 'PARTIEL' && data.acompteRecu && (
              <>
                <View style={pdfS.totalSubLine}>
                  <Text style={pdfS.acompteGreen}>Acompte reçu</Text>
                  <Text style={pdfS.acompteGreen}>- {formatXOF(data.acompteRecu)}</Text>
                </View>
                <View style={pdfS.partialLine}>
                  <Text style={pdfS.partialLabel}>Solde restant</Text>
                  <Text style={pdfS.partialValue}>{formatXOF(solde)}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Terms */}
        <View style={pdfS.termsSection}>
          <View style={pdfS.termsBlock}>
            <Text style={[pdfS.termsLabel, { color: GREEN }]}>MODALITÉS DE PAIEMENT</Text>
            <Text style={pdfS.termsText}>Virement bancaire, espèces ou mobile money</Text>
            <Text style={pdfS.termsText}>Paiement mensuel en Franc CFA (XOF)</Text>
            <Text style={pdfS.termsText}>Acompte de 50% à la signature</Text>
          </View>
          <View style={pdfS.termsBlock}>
            <Text style={[pdfS.termsLabel, { color: GRAY_TEXT }]}>NOTES</Text>
            {data.datePaiement ? (
              <Text style={pdfS.termsGreen}>Paiement reçu le {formatDateFr(data.datePaiement)} — Merci !</Text>
            ) : (
              <>
                <Text style={pdfS.termsText}>Pour toute question, contactez-nous :</Text>
                <Text style={{ fontSize: 10, color: '#0077B6', marginTop: 3 }}>hello@abdoulazizfall.com</Text>
              </>
            )}
          </View>
        </View>

        {/* Decorative separator */}
        <View style={pdfS.decoSep} />

        {/* Footer */}
        <View style={pdfS.footer}>
          <Text style={pdfS.footerLeft}>Persona Genius</Text>
          <Text style={pdfS.footerCenter}>{data.invoiceNumber}</Text>
          <Text style={pdfS.footerRight}>Merci pour votre confiance</Text>
        </View>

        {/* Bottom decorative band */}
        <View style={pdfS.bottomBand}>
          <View style={pdfS.bandGreen} />
          <View style={pdfS.bandNavy} />
        </View>
      </PdfPage>
    </Document>
  );
};
export default function AdminComptabilite() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [formules, setFormules] = useState<Formule[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceLines, setInvoiceLines] = useState<any[]>([]);

  // Modals
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; clientId: string }>({ open: false, clientId: '' });
  const [relanceModal, setRelanceModal] = useState<{ open: boolean; client: Client | null }>({ open: false, client: null });
  const [expenseModal, setExpenseModal] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState<{ open: boolean; clientId: string }>({ open: false, clientId: '' });

  // Forms
  const [paymentForm, setPaymentForm] = useState({ montant: '', date: '', methode: '', notes: '' });
  const [expenseForm, setExpenseForm] = useState({ categorie: 'Autre', montant: '', date: '', description: '' });
  const [relanceMessage, setRelanceMessage] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  // Helper: get the real monthly amount from formule if client amount is 0
  const getClientMontant = (client: Client) => {
    if (client.montant_mensuel_xof && client.montant_mensuel_xof > 0) return client.montant_mensuel_xof;
    const f = formules.find(fm => fm.nom.toLowerCase() === (client.formule || '').toLowerCase());
    return f?.prix_xof || 0;
  };

  const load = async () => {
    const [{ data: cl }, { data: fm }, { data: pay }, { data: exp }, { data: inv }, { data: il }] = await Promise.all([
      supabase.from('clients').select('id, nom, formule, montant_mensuel_xof, statut_paiement, photo_url, email, whatsapp, titre_professionnel').eq('archived', false),
      supabase.from('formules').select('id, nom, prix_xof, features, description'),
      supabase.from('payment_history').select('*').order('date_paiement', { ascending: false }),
      supabase.from('expenses').select('*').order('date_depense', { ascending: false }),
      supabase.from('invoices').select('*, clients(nom)').order('date_emission', { ascending: false }),
      supabase.from('invoice_lines').select('*'),
    ]);
    setClients(cl || []);
    setFormules((fm as Formule[]) || []);
    setPayments(pay || []);
    setExpenses((exp as Expense[]) || []);
    setInvoices((inv as Invoice[]) || []);
    setInvoiceLines(il || []);
  };

  useEffect(() => { load(); }, []);

  // Client payment info
  const getClientPaymentInfo = (clientId: string) => {
    const clientPayments = payments.filter(p => p.client_id === clientId);
    const client = clients.find(c => c.id === clientId);
    const totalPaid = clientPayments.reduce((s, p) => s + p.montant_xof, 0);
    const monthlyAmount = client ? getClientMontant(client) : 0;
    const lastPayment = clientPayments[0];
    const soldeDu = Math.max(0, monthlyAmount - totalPaid);
    return { totalPaid, lastPayment, soldeDu, monthlyAmount };
  };

  const getRetardJours = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client?.statut_paiement !== 'en_retard') return 0;
    const clientInvoices = invoices.filter(i => i.client_id === clientId && i.statut === 'en_retard');
    if (clientInvoices.length === 0) return 0;
    const oldest = clientInvoices.reduce((a, b) => a.date_echeance < b.date_echeance ? a : b);
    return Math.max(0, Math.floor((Date.now() - new Date(oldest.date_echeance).getTime()) / 86400000));
  };

  // Financial summary
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthPayments = payments.filter(p => p.date_paiement.startsWith(currentMonth));
  const monthExpenses = expenses.filter(e => e.date_depense.startsWith(currentMonth));
  const totalRevenus = monthPayments.reduce((s, p) => s + p.montant_xof, 0);
  const totalDepenses = monthExpenses.reduce((s, e) => s + e.montant_xof, 0);
  const margeNette = totalRevenus - totalDepenses;
  const margePct = totalRevenus > 0 ? Math.round((margeNette / totalRevenus) * 100) : 0;
  const clientsEnRetard = clients.filter(c => c.statut_paiement === 'en_retard').length;

  // Charts data
  const barData = useMemo(() => {
    const months: Record<string, { revenus: number; depenses: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      months[key] = { revenus: 0, depenses: 0 };
    }
    payments.forEach(p => { if (months[p.date_paiement.slice(0, 7)]) months[p.date_paiement.slice(0, 7)].revenus += p.montant_xof; });
    expenses.forEach(e => { if (months[e.date_depense.slice(0, 7)]) months[e.date_depense.slice(0, 7)].depenses += e.montant_xof; });
    return Object.entries(months).map(([m, v]) => ({ mois: new Date(m + '-01').toLocaleDateString('fr-FR', { month: 'short' }), ...v }));
  }, [payments, expenses]);

  const donutData = useMemo(() => {
    const cats: Record<string, number> = {};
    monthExpenses.forEach(e => { cats[e.categorie] = (cats[e.categorie] || 0) + e.montant_xof; });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [monthExpenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (filterMonth && !e.date_depense.startsWith(filterMonth)) return false;
      if (filterCat !== 'all' && e.categorie !== filterCat) return false;
      return true;
    });
  }, [expenses, filterMonth, filterCat]);

  // Handlers
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const clientId = paymentModal.clientId;
    const montantPaye = parseInt(paymentForm.montant) || 0;

    const { error } = await supabase.from('payment_history').insert({
      client_id: clientId,
      montant_xof: montantPaye,
      date_paiement: paymentForm.date,
      methode: paymentForm.methode || null,
      notes: paymentForm.notes || null,
      created_by: user?.id,
    });
    if (error) { toast.error('Erreur enregistrement'); return; }

    // Auto-update payment status
    const client = clients.find(c => c.id === clientId);
    const monthlyAmount = client ? getClientMontant(client) : 0;
    const previousPayments = payments.filter(p => p.client_id === clientId);
    const totalPaid = previousPayments.reduce((s, p) => s + p.montant_xof, 0) + montantPaye;

    let newStatut = 'en_attente';
    if (totalPaid >= monthlyAmount && monthlyAmount > 0) {
      newStatut = 'paye';
    } else if (totalPaid > 0 && totalPaid < monthlyAmount) {
      newStatut = 'partiel';
    }

    await supabase.from('clients').update({ statut_paiement: newStatut }).eq('id', clientId);

    // Also update invoice status if fully paid
    if (newStatut === 'paye') {
      const clientInvoices = invoices.filter(i => i.client_id === clientId && i.statut !== 'payee');
      for (const inv of clientInvoices) {
        await supabase.from('invoices').update({ statut: 'payee' }).eq('id', inv.id);
      }
    }

    toast.success('Paiement enregistré');
    setPaymentModal({ open: false, clientId: '' });
    setPaymentForm({ montant: '', date: '', methode: '', notes: '' });
    load();
  };

  const handleExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('expenses').insert({
      categorie: expenseForm.categorie,
      montant_xof: parseInt(expenseForm.montant) || 0,
      date_depense: expenseForm.date,
      description: expenseForm.description,
      created_by: user?.id,
    });
    if (error) { toast.error('Erreur enregistrement'); return; }
    toast.success('Dépense enregistrée');
    setExpenseModal(false);
    setExpenseForm({ categorie: 'Autre', montant: '', date: '', description: '' });
    load();
  };

  const handleRelance = async () => {
    if (!relanceModal.client) { toast.error('Client introuvable'); return; }
    const { data: clientData } = await supabase.from('clients').select('user_id').eq('id', relanceModal.client.id).single();
    if (!clientData?.user_id) { toast.error('Client sans compte'); return; }
    const { error } = await supabase.from('notifications').insert({
      user_id: clientData.user_id,
      title: 'Rappel de paiement',
      message: relanceMessage,
    });
    if (error) { toast.error('Erreur envoi'); return; }
    toast.success('Relance envoyée');
    setRelanceModal({ open: false, client: null });
  };

  const openRelance = (client: Client) => {
    const retard = getRetardJours(client.id);
    const montant = getClientMontant(client);
    setRelanceMessage(`Bonjour ${client.nom.split(' ')[0]}, nous n'avons pas encore reçu votre règlement de ${formatXOF(montant)} avec ${retard} jours de retard. Merci de régulariser votre situation dans les meilleurs délais.`);
    setRelanceModal({ open: true, client });
  };

  const generatePdf = async (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) { toast.error('Client introuvable'); return; }

    const montant = getClientMontant(client);
    const formule = formules.find(fm => fm.nom.toLowerCase() === (client.formule || '').toLowerCase());
    const formuleName = formule?.nom || client.formule || 'Standard';
    const formuleFeatures = formule?.features || [];

    let clientInvoices = invoices.filter(i => i.client_id === clientId);
    let inv = clientInvoices[0];

    // Auto-create invoice if none exists
    if (!inv) {
      const now = new Date();
      const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      // Sequential numbering: FAC-YYYYMM-0001
      const monthInvoices = invoices.filter(i => i.numero.includes(`FAC-${ym}-`));
      const maxSeq = monthInvoices.reduce((max, i) => {
        const seq = parseInt(i.numero.split('-').pop() || '0');
        return seq > max ? seq : max;
      }, 0);
      const numero = `FAC-${ym}-${String(maxSeq + 1).padStart(4, '0')}`;
      const echeance = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString().split('T')[0];

      const { data: newInv, error: invErr } = await supabase.from('invoices').insert({
        client_id: clientId,
        numero,
        montant_xof: montant,
        date_emission: now.toISOString().split('T')[0],
        date_echeance: echeance,
        statut: 'en_attente',
        created_by: user?.id,
      }).select().single();

      if (invErr || !newInv) { toast.error('Erreur création facture'); return; }

      await supabase.from('invoice_lines').insert({
        invoice_id: newInv.id,
        description: `Prestation Personal Branding — Formule ${formuleName}`,
        quantite: 1,
        prix_unitaire_xof: montant,
      });

      inv = newInv as Invoice;
      await load();
    }

    // Determine status
    const clientPayments = payments.filter(p => p.client_id === clientId);
    const totalPaid = clientPayments.reduce((s, p) => s + p.montant_xof, 0);
    const lastPayment = clientPayments[0];
    let pdfStatus: InvoicePdfData['status'] = 'EN_ATTENTE';
    if (client.statut_paiement === 'paye') pdfStatus = 'PAYE';
    else if (client.statut_paiement === 'partiel') pdfStatus = 'PARTIEL';
    else if (client.statut_paiement === 'en_retard') pdfStatus = 'EN_RETARD';

    const now = new Date();
    const periode = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    // Check for shooting this period
    const { data: shootings } = await supabase.from('shooting_history')
      .select('*').eq('client_id', clientId)
      .gte('date_shooting', new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0])
      .lte('date_shooting', new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);

    const shooting = shootings && shootings.length > 0 ? {
      type: 'Standard',
      date: new Date(shootings[0].date_shooting),
      nbPhotos: shootings[0].nombre_photos,
    } : undefined;

    const pdfData: InvoicePdfData = {
      invoiceNumber: inv.numero,
      emissionDate: new Date(inv.date_emission),
      dueDate: new Date(inv.date_echeance),
      status: pdfStatus,
      clientNom: client.nom,
      clientProfession: client.titre_professionnel || '',
      clientEmail: client.email || '',
      clientWhatsapp: client.whatsapp || '',
      formuleName,
      formuleFeatures,
      montantXOF: inv.montant_xof,
      periode,
      acompteRecu: pdfStatus === 'PARTIEL' ? totalPaid : undefined,
      datePaiement: pdfStatus === 'PAYE' && lastPayment ? new Date(lastPayment.date_paiement) : undefined,
      shooting,
    };

    try {
      const blob = await pdf(<InvoicePdf data={pdfData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `Facture-PG-${inv.numero}.pdf`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('Facture téléchargée');
    } catch (err) {
      toast.error('Erreur génération PDF');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Comptabilité</h1>
          <p className="text-muted-foreground font-body mt-1 text-sm">Suivi financier — Admin uniquement</p>
        </div>
        <Button onClick={() => setExpenseModal(true)} className="bg-primary hover:bg-secondary text-primary-foreground font-heading font-semibold gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Nouvelle dépense
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#F0FDF4' }}><TrendingUp className="h-5 w-5" style={{ color: '#16A34A' }} /></div>
            <span className="text-muted-foreground font-body text-sm">Revenus du mois</span>
          </div>
          <p className="font-heading text-2xl font-bold text-foreground">{formatXOF(totalRevenus)}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}><TrendingDown className="h-5 w-5" style={{ color: '#DC2626' }} /></div>
            <span className="text-muted-foreground font-body text-sm">Dépenses du mois</span>
          </div>
          <p className="font-heading text-2xl font-bold text-foreground">{formatXOF(totalDepenses)}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: margeNette >= 0 ? '#F0FDF4' : '#FEF2F2' }}>
              <Wallet className="h-5 w-5" style={{ color: margeNette >= 0 ? '#16A34A' : '#DC2626' }} />
            </div>
            <span className="text-muted-foreground font-body text-sm">Marge nette</span>
          </div>
          <p className="font-heading text-2xl font-bold text-foreground">{formatXOF(margeNette)}</p>
          <span className="text-sm font-body" style={{ color: margeNette >= 0 ? '#16A34A' : '#DC2626' }}>{margePct}%</span>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}><AlertTriangle className="h-5 w-5" style={{ color: '#DC2626' }} /></div>
            <span className="text-muted-foreground font-body text-sm">Clients en retard</span>
          </div>
          <p className="font-heading text-2xl font-bold text-foreground">{clientsEnRetard}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="font-heading font-semibold text-foreground mb-4">Revenus vs Dépenses (6 mois)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatXOF(v)} />
              <Bar dataKey="revenus" fill="#16A34A" radius={[4, 4, 0, 0]} name="Revenus" />
              <Bar dataKey="depenses" fill="#DC2626" radius={[4, 4, 0, 0]} name="Dépenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-5">
          <h3 className="font-heading font-semibold text-foreground mb-4">Dépenses par catégorie</h3>
          {donutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatXOF(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-16">Aucune dépense ce mois</p>
          )}
          <div className="mt-2 space-y-1">
            {donutData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs font-body">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="ml-auto font-medium">{formatXOF(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList className="glass-card w-full sm:w-auto flex-wrap">
          <TabsTrigger value="clients" className="font-heading">Suivi clients</TabsTrigger>
          <TabsTrigger value="depenses" className="font-heading">Dépenses</TabsTrigger>
          <TabsTrigger value="factures" className="font-heading">Factures</TabsTrigger>
        </TabsList>

        {/* === CLIENTS TAB === */}
        <TabsContent value="clients">
          <div className="glass-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Formule</TableHead>
                  <TableHead>Montant mensuel</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernier paiement</TableHead>
                  <TableHead>Solde dû</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map(c => {
                  const info = getClientPaymentInfo(c.id);
                  const status = paymentStatusConfig[c.statut_paiement || 'en_attente'];
                  const retard = getRetardJours(c.id);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-heading font-semibold">{c.nom}</TableCell>
                      <TableCell className="capitalize font-body">{c.formule || '—'}</TableCell>
                      <TableCell className="font-heading font-semibold">{formatXOF(getClientMontant(c))}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border" style={{ color: status.color, backgroundColor: status.bg, borderColor: status.color + '33' }}>
                          {status.label}
                          {c.statut_paiement === 'en_retard' && retard > 0 && ` (${retard}j)`}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-body text-sm">
                        {info.lastPayment ? new Date(info.lastPayment.date_paiement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                      </TableCell>
                      <TableCell className="font-heading font-semibold" style={{ color: info.soldeDu > 0 ? '#DC2626' : '#16A34A' }}>
                        {formatXOF(info.soldeDu)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => { setPaymentModal({ open: true, clientId: c.id }); setPaymentForm({ montant: '', date: new Date().toISOString().slice(0, 10), methode: '', notes: '' }); }}>
                            Paiement
                          </Button>
                          {c.statut_paiement === 'en_retard' && (
                            <Button size="sm" variant="outline" className="border-destructive text-destructive" onClick={() => openRelance(c)}>
                              <Send className="h-3 w-3 mr-1" /> Relancer
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => generatePdf(c.id)}>
                            <FileDown className="h-3 w-3 mr-1" /> PDF
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {clients.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Wallet className="h-10 w-10 text-muted-foreground/30" />
                      <p className="font-heading font-semibold text-foreground">Aucun paiement enregistré ce mois</p>
                      <p className="text-sm">Les paiements apparaîtront ici une fois enregistrés</p>
                    </div>
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* === DEPENSES TAB === */}
        <TabsContent value="depenses">
          <div className="flex gap-3 mb-4">
            <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-48" />
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {expenseCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="glass-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="font-body text-sm">{new Date(e.date_depense).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</TableCell>
                    <TableCell><Badge variant="outline">{e.categorie}</Badge></TableCell>
                    <TableCell className="font-body">{e.description}</TableCell>
                    <TableCell className="text-right font-heading font-semibold">{formatXOF(e.montant_xof)}</TableCell>
                  </TableRow>
                ))}
                {filteredExpenses.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Aucune dépense</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* === FACTURES TAB === */}
        <TabsContent value="factures">
          <div className="glass-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Émission</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map(inv => {
                  const statusKey = inv.statut === 'payee' ? 'paye' : inv.statut === 'en_retard' ? 'en_retard' : 'en_attente';
                  const st = paymentStatusConfig[statusKey];
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-heading font-medium">{inv.numero}</TableCell>
                      <TableCell>{(inv.clients as any)?.nom || '—'}</TableCell>
                      <TableCell className="font-heading font-semibold">{formatXOF(inv.montant_xof)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" style={{ color: st.color, backgroundColor: st.bg, borderColor: st.color + '33' }}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="font-body text-sm">{new Date(inv.date_emission).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</TableCell>
                      <TableCell className="font-body text-sm">{new Date(inv.date_echeance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => {
                          const client = clients.find(c => c.id === inv.client_id);
                          if (client) generatePdf(client.id);
                        }}>
                          <FileDown className="h-3 w-3 mr-1" /> PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {invoices.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Aucune facture</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Payment Modal */}
      <Dialog open={paymentModal.open} onOpenChange={o => setPaymentModal({ ...paymentModal, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Enregistrer un paiement</DialogTitle></DialogHeader>
          <form onSubmit={handlePayment} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Montant (XOF) *</Label><Input type="number" value={paymentForm.montant} onChange={e => setPaymentForm({ ...paymentForm, montant: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Date *</Label><Input type="date" value={paymentForm.date} onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })} required /></div>
            </div>
            <div className="space-y-2">
              <Label>Mode de paiement</Label>
              <Select value={paymentForm.methode} onValueChange={v => setPaymentForm({ ...paymentForm, methode: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="virement">Virement</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="especes">Espèces</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Commentaire</Label><Textarea value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} /></div>
            <Button type="submit" className="w-full" style={{ backgroundColor: '#8FC500' }}>Enregistrer</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Relance Modal */}
      <Dialog open={relanceModal.open} onOpenChange={o => setRelanceModal({ ...relanceModal, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Relancer {relanceModal.client?.nom}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <Textarea value={relanceMessage} onChange={e => setRelanceMessage(e.target.value)} rows={5} />
            <Button onClick={handleRelance} className="w-full" style={{ backgroundColor: '#DC2626' }}>
              <Send className="h-4 w-4 mr-2" /> Envoyer la relance
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expense Modal */}
      <Dialog open={expenseModal} onOpenChange={setExpenseModal}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Nouvelle dépense</DialogTitle></DialogHeader>
          <form onSubmit={handleExpense} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Catégorie *</Label>
              <Select value={expenseForm.categorie} onValueChange={v => setExpenseForm({ ...expenseForm, categorie: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {expenseCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Montant (XOF) *</Label><Input type="number" value={expenseForm.montant} onChange={e => setExpenseForm({ ...expenseForm, montant: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Date *</Label><Input type="date" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} required /></div>
            </div>
            <div className="space-y-2"><Label>Description *</Label><Textarea value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} required /></div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground">Enregistrer</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
