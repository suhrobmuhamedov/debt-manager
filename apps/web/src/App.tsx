import { Suspense, lazy, useEffect, useState } from 'react';
import { Router, Route, Switch, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { trpc, trpcClient } from './lib/trpc';
import { AuthWrapper } from './components/common/AuthWrapper';
import { AppLayout } from './components/layout/AppLayout';

// Dashboard — eager (birinchi ko'rinadigan sahifa, lazy qilinmaydi)
import { Dashboard } from './pages/Dashboard';

// Lazy sahifalar — faqat navigatsiya qilganda yuklanadi
const Debts = lazy(() => import('./pages/Debts').then(m => ({ default: m.Debts })));
const DebtDetail = lazy(() => import('./pages/DebtDetail').then(m => ({ default: m.DebtDetail })));
const Contacts = lazy(() => import('./pages/Contacts').then(m => ({ default: m.Contacts })));
const ContactDetail = lazy(() => import('./pages/ContactDetail').then(m => ({ default: m.ContactDetail })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));
const ModalRenderer = lazy(() => import('./components/modals/ModalRenderer').then(m => ({ default: m.ModalRenderer })));

// Prefetch funksiyalari — BottomNav hover/touch da chaqiradi
export const prefetchDebts = () => import('./pages/Debts');
export const prefetchContacts = () => import('./pages/Contacts');
export const prefetchProfile = () => import('./pages/Profile');

function PageLoader() {
  return (
    <AppLayout>
      <div className="p-4 space-y-3">
        <div className="h-5 w-28 rounded-md bg-white/25 dark:bg-white/10" />
        <div className="h-20 rounded-2xl bg-white/25 dark:bg-white/10" />
        <div className="h-20 rounded-2xl bg-white/25 dark:bg-white/10" />
        <div className="h-20 rounded-2xl bg-white/25 dark:bg-white/10" />
      </div>
    </AppLayout>
  );
}

function AppRoutes() {
  const [, navigate] = useLocation();

  useEffect(() => {
    const startParam = window.Telegram?.WebApp?.initDataUnsafe &&
      (window.Telegram.WebApp.initDataUnsafe as { start_param?: string }).start_param;

    if (!startParam) {
      return;
    }

    const match = startParam.match(/^debt_(\d+)$/);
    if (!match) {
      return;
    }

    const debtId = Number(match[1]);
    if (Number.isFinite(debtId)) {
      navigate(`/debts/${debtId}`);
    }
  }, [navigate]);

  useEffect(() => {
    const runPrefetch = () => {
      void prefetchDebts();
      void prefetchContacts();
      void prefetchProfile();
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(runPrefetch);
      return () => {
        if ('cancelIdleCallback' in window) {
          (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
        }
      };
    }

    const timeoutId = window.setTimeout(runPrefetch, 1200);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <AuthWrapper>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/debts" component={Debts} />
          <Route path="/debts/:id" component={DebtDetail} />
          <Route path="/contacts" component={Contacts} />
          <Route path="/contacts/:id" component={ContactDetail} />
          <Route path="/profile" component={Profile} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </AuthWrapper>
  );
}

function App() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
      },
    },
  }));

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AppRoutes />
        </Router>

        <Suspense fallback={null}>
          <ModalRenderer />
        </Suspense>
        <Toaster position="top-center" richColors />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;