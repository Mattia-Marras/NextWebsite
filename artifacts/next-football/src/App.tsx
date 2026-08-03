import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";

import NotFound from "@/pages/not-found";

// Pages
import { Landing } from "@/pages/landing";
import { Home } from "@/pages/home";
import { Results } from "@/pages/results";
import { Fixtures } from "@/pages/fixtures";
import { Standings } from "@/pages/standings";
import { Admin } from "@/pages/admin";
import { ProfileSearch } from "@/pages/profile-search";
import { Profile } from "@/pages/profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        {/* Static routes */}
        <Route path="/" component={Landing} />
        <Route path="/admin" component={Admin} />

        {/* Player profile routes */}
        <Route path="/profile" component={ProfileSearch} />
        <Route path="/profile/:uuid" component={Profile} />

        {/* Dynamic league routes */}
        <Route
          path="/:server/:league/results"
          component={Results}
        />
        <Route
          path="/:server/:league/fixtures"
          component={Fixtures}
        />
        <Route
          path="/:server/:league/standings"
          component={Standings}
        />
        <Route path="/:server/:league" component={Home} />

        {/* Fallback */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={basePath}>
          <Router />
        </WouterRouter>

        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

