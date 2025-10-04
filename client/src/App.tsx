import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import NotFound from "@/pages/not-found";

// Public pages
import Landing from "@/pages/public/Landing";
import Features from "@/pages/public/Features";
import Pricing from "@/pages/public/Pricing";
import FAQ from "@/pages/public/FAQ";
import Contact from "@/pages/public/Contact";
import Privacy from "@/pages/public/Privacy";
import Trust from "@/pages/public/Trust";
import Terms from "@/pages/public/Terms";
import Sample from "@/pages/Sample";

// Auth pages
import PostInstall from "@/pages/PostInstall";
import NoOrg from "@/pages/NoOrg";
import Auth from "@/pages/Auth";

// Admin pages
import GetStarted from "@/pages/admin/GetStarted";
import FeedbackManagement from "@/pages/admin/FeedbackManagement";
import TopicManagement from "@/pages/admin/TopicManagement";
import TopicSuggestions from "@/pages/admin/TopicSuggestions";
import SlackSettings from "@/pages/admin/SlackSettings";
import BillingSettings from "@/pages/admin/BillingSettings";
import Billing from "@/pages/admin/Billing";
import Compliance from "@/pages/admin/Compliance";
import SystemHealth from "@/pages/admin/SystemHealth";
import AuditLog from "@/pages/admin/AuditLog";
import Analytics from "@/pages/admin/Analytics";
import Export from "@/pages/admin/Export";
import Retention from "@/pages/admin/Retention";
import UserManagement from "@/pages/admin/UserManagement";
import Themes from "@/pages/admin/Themes";

function Router() {
  return (
    <Switch>
      {/* Public pages */}
      <Route path="/" component={Landing} />
      <Route path="/features" component={Features} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/faq" component={FAQ} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/trust" component={Trust} />
      <Route path="/terms" component={Terms} />
      <Route path="/sample" component={Sample} />

      {/* Auth pages */}
      <Route path="/post-install" component={PostInstall} />
      <Route path="/no-org" component={NoOrg} />
      <Route path="/auth" component={Auth} />

      {/* Admin pages */}
      <Route path="/admin/get-started" component={GetStarted} />
      <Route path="/admin/feedback" component={FeedbackManagement} />
      <Route path="/admin/topics" component={TopicManagement} />
      <Route path="/admin/topic-suggestions" component={TopicSuggestions} />
      <Route path="/admin/users" component={UserManagement} />
      <Route path="/admin/slack-settings" component={SlackSettings} />
      <Route path="/admin/billing-old" component={BillingSettings} />
      <Route path="/admin/billing" component={Billing} />
      <Route path="/admin/compliance" component={Compliance} />
      <Route path="/admin/system-health" component={SystemHealth} />
      <Route path="/admin/audit-log" component={AuditLog} />
      <Route path="/admin/analytics" component={Analytics} />
      <Route path="/admin/themes" component={Themes} />
      <Route path="/admin/export" component={Export} />
      <Route path="/admin/retention" component={Retention} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <header className="flex h-14 items-center gap-4 border-b px-6">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex-1" />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}

function AppRouter() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");

  const Layout = isAdmin ? AdminLayout : PublicLayout;

  return (
    <Layout>
      <Router />
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
