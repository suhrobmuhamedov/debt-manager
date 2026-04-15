import { useTranslation } from "react-i18next"

import { Button } from "../ui/button"
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
            {isAbout ? t("profile.aboutDescription") : t("profile.privacyDescription")}
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
                <p>{t("profile.aboutDescription")}</p>
                <p>
                  <span className="font-medium">{t("profile.developer")}:</span> SUHROB
                </p>
                <p>
                  <span className="font-medium">{t("profile.channel")}:</span> @qarzdaftarim
                </p>
              </div>

              <Button asChild className="w-full">
                <a href="https://t.me/qarzdaftarim" target="_blank" rel="noreferrer">
                  {t("common.open")}
                </a>
              </Button>
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
