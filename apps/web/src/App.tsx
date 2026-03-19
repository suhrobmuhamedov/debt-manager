import { Router, Route } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { trpc } from './lib/trpc';
import { AuthWrapper } from './components/common/AuthWrapper';
import { ModalRenderer } from './components/modals/ModalRenderer';
import { Dashboard } from './pages/Dashboard';
import { Debts } from './pages/Debts';
import { DebtDetail } from './pages/DebtDetail';
import { Contacts } from './pages/Contacts';
import { ContactDetail } from './pages/ContactDetail';
import { Profile } from './pages/Profile';
import { NotFound } from './pages/NotFound';

function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/trpc',
          fetch: (url, options) => {
            return fetch(url, {
              ...options,
              credentials: 'include',
            });
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthWrapper>
            <Route path="/" component={Dashboard} />
            <Route path="/debts" component={Debts} />
            <Route path="/debts/:id" component={DebtDetail} />
            <Route path="/contacts" component={Contacts} />
            <Route path="/contacts/:id" component={ContactDetail} />
            <Route path="/profile" component={Profile} />
            <Route component={NotFound} />
          </AuthWrapper>
        </Router>

        <ModalRenderer />
        <Toaster position="top-center" richColors />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;