import { useTranslation } from "react-i18next"

import { GlassButton } from "../ui/GlassButton"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet"

type AboutSheetMode = "about" | "privacy"

type AboutSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: AboutSheetMode
}

export const AboutSheet = ({ open, onOpenChange, mode }: AboutSheetProps) => {
  const { t } = useTranslation()
  const isAbout = mode === "about"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="px-4 pb-6">
        <SheetHeader className="px-0">
          <SheetTitle>{isAbout ? t("profile.about") : t("profile.privacyPolicy")}</SheetTitle>
          <SheetDescription>
            {isAbout ? "" : t("profile.privacyDescription")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-1">
          {isAbout ? (
            <>
              <div className="glass-card space-y-1 p-4">
                <p className="text-base font-semibold text-[color:var(--foreground)]">{t("profile.appName")}</p>
                <p className="text-sm text-[color:var(--muted-foreground)]">v1.0.0</p>
              </div>

              <div className="glass-card space-y-2 p-4 text-sm text-[color:var(--foreground)]">
                <p className="font-medium">
                  QarzTrust — qarzlarni boshqarishni soddalashtiruvchi va tartibga soluvchi zamonaviy yechim.
                </p>
                <p>
                  Qarzlarni eslab yurish, eski yozuvlarni qidirish yoki kimga qancha berganingizni qayta tekshirib yurishga endi hojat yo‘q. Ilova barcha jarayonlarni avtomatlashtiradi va sizga aniq nazorat beradi.
                </p>
                <p className="font-semibold">⚙️ Asosiy imkoniyatlar</p>
                <div className="space-y-1">
                  <p>🔔 <strong>Avtomatik eslatmalar</strong><br />Qarz beruvchi va oluvchi tomonlarga o‘z vaqtida bildirishnomalar yuboriladi.</p>
                  <p>🧾 <strong>To‘liq tarix</strong><br />Har bir o‘zgarish saqlanadi — siz har doim oldingi holatlarni ko‘rishingiz mumkin.</p>
                  <p>👥 <strong>Kontaktlar bo‘yicha boshqaruv</strong><br />Har bir inson bilan bog‘liq barcha qarzlar bitta joyda jamlanadi.</p>
                  <p>📊 <strong>Aniq holat nazorati</strong><br />Qarzlar: berilgan, olingan, muddati o‘tgan va to‘langan holatlarda aniq ko‘rsatiladi.</p>
                  <p>🔒 <strong>Ma’lumotlar xavfsizligi</strong><br />Sizning ma’lumotlaringiz himoyalangan va ishonchli saqlanadi.</p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <span>Dasturchi:</span>
                  <GlassButton
                    variant="glass"
                    className="h-8 px-3 py-1 text-xs"
                    onClick={() => window.open('https://t.me/Muhamedov_S', '_blank')}
                  >
                    SUHROB
                  </GlassButton>
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card p-4 text-sm text-[color:var(--foreground)]">
              <p>{t("profile.privacyDescription")}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
