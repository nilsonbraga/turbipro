import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import Dashboard from "@/pages/Dashboard";
import Leads from "@/pages/Leads";
import Tasks from "@/pages/Tasks";
import Clients from "@/pages/Clients";
import FavoriteDestinations from "@/pages/FavoriteDestinations";
import Partners from "@/pages/Partners";
import CalendarPage from "@/pages/CalendarPage";
import Agencies from "@/pages/Agencies";
import Tags from "@/pages/Tags";
import EmailPage from "@/pages/EmailPage";
import WhatsAppPage from "@/pages/WhatsAppPage";
import Auth from "@/pages/Auth";
import Register from "@/pages/Register";
import NotFound from "@/pages/NotFound";
import PublicProposal from "@/pages/PublicProposal";
import SubscriptionPlans from "@/pages/SubscriptionPlans";
import Expeditions from "@/pages/Expeditions";
import PublicExpedition from "@/pages/PublicExpedition";
import Financial from "@/pages/Financial";
import Studio from "@/pages/Studio";
import TeamOperations from "@/pages/TeamOperations";
import Suppliers from "@/pages/Suppliers";
import Itineraries from "@/pages/Itineraries";
import ItineraryEditor from "@/pages/ItineraryEditor";
import PublicItinerary from "@/pages/PublicItinerary";

// Settings pages
import AgencySettings from "@/pages/settings/AgencySettings";
import ProfileSettings from "@/pages/settings/ProfileSettings";
import UsersSettings from "@/pages/settings/UsersSettings";
import NotificationsSettings from "@/pages/settings/NotificationsSettings";
import PipelineSettings from "@/pages/settings/PipelineSettings";
import IntegrationsSettings from "@/pages/settings/IntegrationsSettings";
import PlatformSettings from "@/pages/settings/PlatformSettings";
import PlansSettings from "@/pages/settings/PlansSettings";

import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SubscriptionGuard>
      {children}
    </SubscriptionGuard>
  );
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, role, isSuperAdmin } = useAuth();
  const isAdmin = role === 'admin' || isSuperAdmin;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <SubscriptionGuard>
      {children}
    </SubscriptionGuard>
  );
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isSuperAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <SubscriptionGuard>
      {children}
    </SubscriptionGuard>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout frame={false}>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leads"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Leads />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Tasks />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Clients />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/favorite-destinations"
        element={
          <ProtectedRoute>
            <AppLayout>
              <FavoriteDestinations />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/partners"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Partners />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CalendarPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/financial"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Financial />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/agencies"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Agencies />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tags"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Tags />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/email"
        element={
          <ProtectedRoute>
            <AppLayout>
              <EmailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/whatsapp"
        element={
          <ProtectedRoute>
            <AppLayout>
              <WhatsAppPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/expeditions"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Expeditions />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/studio"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Studio />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/team"
        element={
          <ProtectedRoute>
            <AppLayout>
              <TeamOperations />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/suppliers"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Suppliers />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/itineraries"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Itineraries />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/itineraries/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ItineraryEditor />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Settings Routes */}
      <Route
        path="/settings/agency"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AgencySettings />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProfileSettings />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/users"
        element={
          <AdminRoute>
            <AppLayout>
              <UsersSettings />
            </AppLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/settings/notifications"
        element={
          <ProtectedRoute>
            <AppLayout>
              <NotificationsSettings />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/pipeline"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PipelineSettings />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/integrations"
        element={
          <AdminRoute>
            <AppLayout>
              <IntegrationsSettings />
            </AppLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/settings/platform"
        element={
          <SuperAdminRoute>
            <AppLayout>
              <PlatformSettings />
            </AppLayout>
          </SuperAdminRoute>
        }
      />
      <Route
        path="/settings/plans"
        element={
          <SuperAdminRoute>
            <AppLayout>
              <PlansSettings />
            </AppLayout>
          </SuperAdminRoute>
        }
      />
      {/* Redirect old /settings to /settings/agency */}
      <Route
        path="/settings"
        element={<Navigate to="/settings/agency" replace />}
      />

      {/* Public route for proposals - no auth needed */}
      <Route path="/p/:token" element={<PublicProposal />} />
      {/* Public expedition registration */}
      <Route path="/expeditions/:token" element={<PublicExpedition />} />
      {/* Public itinerary page */}
      <Route path="/roteiro/:token" element={<PublicItinerary />} />
      {/* Public subscription plans page */}
      <Route path="/planos" element={<SubscriptionPlans />} />
      {/* Public registration page */}
      <Route 
        path="/registrar" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
