import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";

import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Landing from "./pages/Landing";
import Inscription from "./pages/Inscription";
import NotFound from "./pages/NotFound";
import ValidatePost from "./pages/ValidatePost";
import Setup from "./pages/Setup";
import ContratSignature from "./pages/ContratSignature";
import Confirmation from "./pages/Confirmation";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminClients from "./pages/admin/Clients";
import AdminClientDetail from "./pages/admin/ClientDetail";
import AdminCalendrier from "./pages/admin/Calendrier";
import AdminFacturation from "./pages/admin/Facturation";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminEquipe from "./pages/admin/Equipe";
import AdminJournal from "./pages/admin/Journal";
import AdminParametres from "./pages/admin/Parametres";
import AdminPosts from "./pages/admin/Posts";
import AdminShootings from "./pages/admin/Shootings";
import AdminLandingEditor from "./pages/admin/LandingEditor";
import AdminContrats from "./pages/admin/Contrats";

// Staff pages (reuse admin components for clients/calendrier/analytics)
import StaffDashboard from "./pages/staff/Dashboard";

// Client pages
import ClientDashboard from "./pages/client/Dashboard";
import ClientCalendrier from "./pages/client/Calendrier";
import ClientFactures from "./pages/client/Factures";
import ClientValides from "./pages/client/Valides";
import ClientProfil from "./pages/client/Profil";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/inscription" element={<Inscription />} />
            <Route path="/onboarding/:token" element={<Onboarding />} />
            <Route path="/valider/:token" element={<ValidatePost />} />
            <Route path="/contrat/:submissionId" element={<ContratSignature />} />
            <Route path="/confirmation" element={<Confirmation />} />
            <Route path="/setup" element={<Setup />} />

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="clients" element={<AdminClients />} />
              <Route path="clients/:id" element={<AdminClientDetail />} />
              <Route path="posts" element={<AdminPosts />} />
              <Route path="calendrier" element={<AdminCalendrier />} />
              <Route path="shootings" element={<AdminShootings />} />
              <Route path="facturation" element={<AdminFacturation />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="equipe" element={<AdminEquipe />} />
              <Route path="landing-page" element={<AdminLandingEditor />} />
              <Route path="contrats" element={<AdminContrats />} />
              <Route path="journal" element={<AdminJournal />} />
              <Route path="parametres" element={<AdminParametres />} />
            </Route>

            {/* Staff routes */}
            <Route path="/staff" element={<ProtectedRoute allowedRoles={['staff']}><DashboardLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<StaffDashboard />} />
              <Route path="clients" element={<AdminClients />} />
              <Route path="clients/:id" element={<AdminClientDetail />} />
              <Route path="posts" element={<AdminPosts />} />
              <Route path="calendrier" element={<AdminCalendrier />} />
              <Route path="shootings" element={<AdminShootings />} />
            </Route>

            {/* Client routes */}
            <Route path="/client" element={<ProtectedRoute allowedRoles={['client']}><DashboardLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<ClientDashboard />} />
              <Route path="calendrier" element={<ClientCalendrier />} />
              <Route path="valides" element={<ClientValides />} />
              <Route path="profil" element={<ClientProfil />} />
              <Route path="factures" element={<ClientFactures />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
