import { router } from '../trpc';
import { authRouter } from './auth.router';
import { contactsRouter } from './contacts.router';
import { debtsRouter } from './debts.router';
import { paymentsRouter } from './payments.router';
import { dashboardRouter } from './dashboard.router';

export const appRouter = router({
  auth: authRouter,
  contacts: contactsRouter,
  debts: debtsRouter,
  payments: paymentsRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
