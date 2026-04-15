import { MessageCircleMore } from "lucide-react"

import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"

export const TelegramOnly = () => {
  const botUsername = import.meta.env.VITE_BOT_USERNAME || "Qarznazoratibot"

  const openInTelegram = () => {
    window.open(`https://t.me/${botUsername}`, "_blank")
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 text-[color:var(--foreground)]">
      <div className="app-bg" aria-hidden>
        <div className="app-bg-gradient" />
      </div>

      <Card className="relative z-10 w-full max-w-md">
        <CardContent className="space-y-5 p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)]">
            <MessageCircleMore className="size-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">Bu ilova faqat Telegram orqali ishlaydi</h1>
            <p className="text-sm text-[color:var(--muted-foreground)]">
              Mini App ni bot ichidan ochsangiz barcha funksiyalar to&apos;liq ishlaydi.
            </p>
          </div>
          <Button onClick={openInTelegram} className="w-full" size="lg">
            Telegramda ochish
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
