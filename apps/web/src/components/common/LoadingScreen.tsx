export const LoadingScreen = () => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[color:var(--background)] text-[color:var(--foreground)]">
      <div className="app-bg" aria-hidden>
        <div className="app-bg-gradient" />
      </div>

      <div className="glass-card relative z-10 flex flex-col items-center gap-4 px-8 py-7 text-center">
        <div className="loading-spinner" />
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Yuklanmoqda...</h2>
          <p className="text-sm text-[color:var(--muted-foreground)]">Ma&apos;lumotlar tayyorlanmoqda.</p>
        </div>
      </div>
    </div>
  )
}
