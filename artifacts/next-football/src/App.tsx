import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

// Pages
import { Landing } from "@/pages/landing";
import { Home } from "@/pages/home";
import { Results } from "@/pages/results";
import { Fixtures } from "@/pages/fixtures";
import { Standings } from "@/pages/standings";
import { Admin } from "@/pages/admin";

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
        <Route path="/" component={Landing} />
        <Route path="/admin" component={Admin} />

        {/* Dynamic Routes */}
        <Route path="/:server/:league" component={Home} />
        <Route path="/:server/:league/results" component={Results} />
        <Route path="/:server/:league/fixtures" component={Fixtures} />
        <Route path="/:server/:league/standings" component={Standings} />

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
