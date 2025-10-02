import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/Navigation";
import NotFound from "@/pages/not-found";

// Public pages
import Landing from "@/pages/public/Landing";
import Pricing from "@/pages/public/Pricing";
import FAQ from "@/pages/public/FAQ";
import Contact from "@/pages/public/Contact";
import Privacy from "@/pages/public/Privacy";
import Trust from "@/pages/public/Trust";
import Terms from "@/pages/public/Terms";

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
import Analytics from "@/pages/admin/Analytics";
import Export from "@/pages/admin/Export";
import Retention from "@/pages/admin/Retention";

function Router() {
  return (
    <Switch>
      {/* Public pages */}
      <Route path="/" component={Landing} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/faq" component={FAQ} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/trust" component={Trust} />
      <Route path="/terms" component={Terms} />

      {/* Auth pages */}
      <Route path="/post-install" component={PostInstall} />
      <Route path="/no-org" component={NoOrg} />
      <Route path="/auth" component={Auth} />

      {/* Admin pages */}
      <Route path="/admin/get-started" component={GetStarted} />
      <Route path="/admin/feedback" component={FeedbackManagement} />
      <Route path="/admin/topics" component={TopicManagement} />
      <Route path="/admin/topic-suggestions" component={TopicSuggestions} />
      <Route path="/admin/slack-settings" component={SlackSettings} />
      <Route path="/admin/billing" component={BillingSettings} />
      <Route path="/admin/analytics" component={Analytics} />
      <Route path="/admin/export" component={Export} />
      <Route path="/admin/retention" component={Retention} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Navigation />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
