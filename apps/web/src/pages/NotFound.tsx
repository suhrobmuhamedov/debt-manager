import { SearchX } from "lucide-react"
import { useLocation } from "wouter"

import { AppLayout } from "../components/layout/AppLayout"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"

export const NotFound = () => {
  const [, setLocation] = useLocation()

  return (
    <AppLayout>
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-8">
        <Card className="w-full text-center">
          <CardContent className="space-y-4 p-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)] text-[color:var(--muted-foreground)]">
              <SearchX className="size-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-[color:var(--foreground)]">Sahifa topilmadi</h1>
              <p className="text-sm text-[color:var(--muted-foreground)]">
                Siz qidirgan sahifa mavjud emas yoki ko&apos;chirib yuborilgan.
              </p>
            </div>
            <Button onClick={() => setLocation("/")} className="w-full">
              Bosh sahifaga qaytish
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
