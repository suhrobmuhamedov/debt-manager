import { Suspense, lazy, useEffect, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"
import { Route, Router, Switch, useLocation } from "wouter"

import { AppLayout } from "./components/layout/AppLayout"
import { SkeletonCard } from "./components/ui/skeleton-card"
import { AuthWrapper } from "./components/common/AuthWrapper"
import { trpc, trpcClient } from "./lib/trpc"

import { Dashboard } from "./pages/Dashboard"

const Debts = lazy(() => import("./pages/Debts").then((module) => ({ default: module.Debts })))
const DebtDetail = lazy(() => import("./pages/DebtDetail").then((module) => ({ default: module.DebtDetail })))
const Contacts = lazy(() => import("./pages/Contacts").then((module) => ({ default: module.Contacts })))
const ContactDetail = lazy(() => import("./pages/ContactDetail").then((module) => ({ default: module.ContactDetail })))
const Profile = lazy(() => import("./pages/Profile").then((module) => ({ default: module.Profile })))
const Admin = lazy(() => import("./pages/Admin").then((module) => ({ default: module.Admin })))
const NotFound = lazy(() => import("./pages/NotFound").then((module) => ({ default: module.NotFound })))
const ModalRenderer = lazy(() =>
  import("./components/modals/ModalRenderer").then((module) => ({ default: module.ModalRenderer }))
)

export const prefetchDebts = () => import("./pages/Debts")
export const prefetchContacts = () => import("./pages/Contacts")
export const prefetchProfile = () => import("./pages/Profile")

function PageLoader() {
  return (
    <AppLayout>
      <div className="space-y-3 p-4">
        <div className="h-5 w-28 rounded-md bg-[color:var(--muted)]" />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </AppLayout>
  )
}

function AppRoutes() {
  const [, navigate] = useLocation()

  useEffect(() => {
    const startParam =
      window.Telegram?.WebApp?.initDataUnsafe &&
      (window.Telegram.WebApp.initDataUnsafe as { start_param?: string }).start_param

    if (!startParam) {
      return
    }

    const match = startParam.match(/^debt_(\d+)$/)
    if (!match) {
      return
    }

    const debtId = Number(match[1])
    if (Number.isFinite(debtId)) {
      navigate(`/debts/${debtId}`)
    }
  }, [navigate])

  useEffect(() => {
    const runPrefetch = () => {
      void prefetchDebts()
      void prefetchContacts()
      void prefetchProfile()
    }

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(runPrefetch)
      return () => {
        if ("cancelIdleCallback" in window) {
          ;(window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId)
        }
      }
    }

    const timeoutId = globalThis.setTimeout(runPrefetch, 1200)
    return () => globalThis.clearTimeout(timeoutId)
  }, [])

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
          <Route path="/a-panel" component={Admin} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </AuthWrapper>
  )
}

function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 10 * 60_000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: 1,
          },
        },
      })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AppRoutes />
        </Router>

        <Suspense fallback={null}>
          <ModalRenderer />
        </Suspense>
        <Toaster position="top-center" theme="system" />
      </QueryClientProvider>
    </trpc.Provider>
  )
}

export default App
