import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

import Home from "@/pages/Home";

import Dashboard from "@/pages/Dashboard";
import WorkerDashboard from "@/pages/WorkerDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminProfile from "@/pages/AdminProfile";
import ClientManagement from "@/pages/ClientManagement";
import WorkerManagement from "@/pages/WorkerManagement";
import AdminManagement from "@/pages/AdminManagement";
import BookingManagement from "@/pages/BookingManagement";
import PendingVerificationsManagement from "@/pages/PendingVerificationsManagement";
import AnalyticsManagement from "@/pages/AnalyticsManagement";
import PlatformSettings from "@/pages/PlatformSettings";
import DistrictManager from "@/pages/DistrictManager";
import Payment from "@/pages/Payment";
import ServiceHistory from "@/pages/ServiceHistory";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/worker-dashboard" component={WorkerDashboard} />
          <Route path="/admin-dashboard" component={AdminDashboard} />
          <Route path="/admin-profile" component={AdminProfile} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/clients" component={ClientManagement} />
          <Route path="/admin/workers" component={WorkerManagement} />
          <Route path="/admin/admins" component={AdminManagement} />
          <Route path="/client-management" component={ClientManagement} />
          <Route path="/worker-management" component={WorkerManagement} />
          <Route path="/admin-management" component={AdminManagement} />
          <Route path="/booking-management" component={BookingManagement} />
          <Route path="/admin/bookings" component={BookingManagement} />
          <Route path="/admin/pending-verifications" component={PendingVerificationsManagement} />
          <Route path="/admin/analytics" component={AnalyticsManagement} />
          <Route path="/admin/settings" component={PlatformSettings} />
          <Route path="/district-manager" component={DistrictManager} />
          <Route path="/payment/:bookingId" component={Payment} />
          <Route path="/service-history" component={ServiceHistory} />
          <Route component={NotFound} />
        </Switch>

      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
