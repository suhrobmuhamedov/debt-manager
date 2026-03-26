import { Suspense, lazy, useEffect, useState } from 'react';
import { Router, Route, Switch, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { trpc, trpcClient } from './lib/trpc';
import { AuthWrapper } from './components/common/AuthWrapper';
import { ModalRenderer } from './components/modals/ModalRenderer';

// Dashboard — eager (birinchi ko'rinadigan sahifa, lazy qilinmaydi)
import { Dashboard } from './pages/Dashboard';

// Lazy sahifalar — faqat navigatsiya qilganda yuklanadi
const Debts = lazy(() => import('./pages/Debts').then(m => ({ default: m.Debts })));
const DebtDetail = lazy(() => import('./pages/DebtDetail').then(m => ({ default: m.DebtDetail })));
const Contacts = lazy(() => import('./pages/Contacts').then(m => ({ default: m.Contacts })));
const ContactDetail = lazy(() => import('./pages/ContactDetail').then(m => ({ default: m.ContactDetail })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

// Prefetch funksiyalari — BottomNav hover/touch da chaqiradi
export const prefetchDebts = () => import('./pages/Debts');
export const prefetchContacts = () => import('./pages/Contacts');
export const prefetchProfile = () => import('./pages/Profile');

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
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
  const [queryClient] = useState(() => new QueryClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AppRoutes />
        </Router>

        <ModalRenderer />
        <Toaster position="top-center" richColors />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;