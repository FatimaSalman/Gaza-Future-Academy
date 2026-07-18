import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { LanguageProvider } from '@/components/language-provider';
import { Layout } from '@/components/layout/layout';

import { Home } from '@/pages/home';
import { Library } from '@/pages/library';
import { StoryReader } from '@/pages/story';
import { Curriculum } from '@/pages/curriculum';
import { Tutor } from '@/pages/tutor';

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/library" component={Library} />
        <Route path="/library/stories/:id" component={StoryReader} />
        <Route path="/curriculum" component={Curriculum} />
        <Route path="/tutor" component={Tutor} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
