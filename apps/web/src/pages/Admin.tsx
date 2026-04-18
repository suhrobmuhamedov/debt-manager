import { useMemo, useState } from "react"
import { Loader2, Send, ShieldCheck, Users } from "lucide-react"
import { toast } from "sonner"

import { AppLayout } from "../components/layout/AppLayout"
import { GlassCard } from "../components/ui/GlassCard"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { SkeletonCard } from "../components/ui/skeleton-card"
import { Textarea } from "../components/ui/textarea"
import { trpc } from "../lib/trpc"

const PAGE_LIMIT = 30

const formatName = (user: {
  firstName?: string | null
  lastName?: string | null
  telegramId?: string | null
}) => {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
  return name || user.telegramId || "Noma'lum"
}

export const Admin = () => {
  const [searchUsers, setSearchUsers] = useState("")
  const [searchDebts, setSearchDebts] = useState("")
  const [debtType, setDebtType] = useState<"all" | "given" | "taken">("all")
  const [debtStatus, setDebtStatus] = useState<"all" | "pending" | "partial" | "paid">("all")
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const [targetMessage, setTargetMessage] = useState("")
  const [targetTelegramId, setTargetTelegramId] = useState("")

  const token = useMemo(() => {
    if (typeof window === "undefined") return ""
    return new URLSearchParams(window.location.search).get("t") || ""
  }, [])

  const verifyToken = trpc.admin.verifyAccessToken.useQuery(
    { token },
    { enabled: Boolean(token), retry: false, refetchOnWindowFocus: false }
  )

  const isAllowed = verifyToken.data?.ok === true

  const usersQuery = trpc.admin.getUsers.useQuery(
    { search: searchUsers || undefined, limit: PAGE_LIMIT, offset: 0 },
    { enabled: isAllowed, refetchOnWindowFocus: false }
  )

  const debtsQuery = trpc.admin.getDebts.useQuery(
    {
      search: searchDebts || undefined,
      type: debtType === "all" ? undefined : debtType,
      status: debtStatus === "all" ? undefined : debtStatus,
      limit: PAGE_LIMIT,
      offset: 0,
    },
    { enabled: isAllowed, refetchOnWindowFocus: false }
  )

  const selectedUserDetails = trpc.admin.getUserDetails.useQuery(
    { userId: selectedUserId || 0 },
    { enabled: isAllowed && Boolean(selectedUserId), refetchOnWindowFocus: false }
  )

  const sendAllMutation = trpc.admin.sendToAll.useMutation({
    onSuccess: (result) => {
      toast.success(`Xabar yuborildi. Jami: ${result.total}, muvaffaqiyatli: ${result.successCount}`)
      setBroadcastMessage("")
    },
    onError: (error) => {
      toast.error(error.message || "Barchaga yuborishda xatolik")
    },
  })

  const sendOneMutation = trpc.admin.sendToOne.useMutation({
    onSuccess: () => {
      toast.success("Target xabar yuborildi")
      setTargetMessage("")
    },
    onError: (error) => {
      toast.error(error.message || "Target xabar yuborishda xatolik")
    },
  })

  const handleSendAll = () => {
    if (!broadcastMessage.trim()) {
      toast.error("Xabar matnini kiriting")
      return
    }
    sendAllMutation.mutate({ message: broadcastMessage.trim() })
  }

  const handleSendOne = () => {
    if (!targetTelegramId.trim()) {
      toast.error("Telegram ID kiriting yoki user tanlang")
      return
    }
    if (!targetMessage.trim()) {
      toast.error("Target xabar matnini kiriting")
      return
    }
    sendOneMutation.mutate({
      telegramId: targetTelegramId.trim(),
      message: targetMessage.trim(),
    })
  }

  if (!token) {
    return (
      <AppLayout>
        <div className="space-y-3 p-4">
          <GlassCard className="p-4 text-sm text-[var(--destructive)]">Admin token topilmadi.</GlassCard>
        </div>
      </AppLayout>
    )
  }

  if (verifyToken.isLoading) {
    return (
      <AppLayout>
        <div className="space-y-3 p-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </AppLayout>
    )
  }

  if (!isAllowed) {
    return (
      <AppLayout>
        <div className="space-y-3 p-4">
          <GlassCard className="p-4 text-sm text-[var(--destructive)]">
            Ruxsat yo&apos;q. Havola eskirgan yoki siz admin emassiz.
          </GlassCard>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-4 p-4">
        <GlassCard className="space-y-2 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="size-4" />
            Yashirin admin panel
          </div>
          <p className="text-xs text-[color:var(--muted-foreground)]">
            Bu bo&apos;lim faqat admin token va telegram ID tekshiruvi muvaffaqiyatli bo&apos;lsa ochiladi.
          </p>
        </GlassCard>

        <GlassCard className="space-y-3 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Send className="size-4" />
            Xabar yuborish
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium">Barchaga xabar</p>
            <Textarea
              value={broadcastMessage}
              onChange={(event) => setBroadcastMessage(event.target.value)}
              placeholder="Barcha foydalanuvchilarga yuboriladigan matn"
            />
            <Button onClick={handleSendAll} disabled={sendAllMutation.isPending}>
              {sendAllMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Barchaga xabar yuborish
            </Button>
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-xs font-medium">Target xabar</p>
            <Select
              value={targetTelegramId || "none"}
              onValueChange={(value) => setTargetTelegramId(value === "none" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Userdan tanlash (ixtiyoriy)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Qo&apos;lda telegram ID kiritaman</SelectItem>
                {(usersQuery.data?.items || []).map((user) => (
                  <SelectItem key={user.id} value={user.telegramId}>
                    {formatName(user)} ({user.telegramId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={targetTelegramId}
              onChange={(event) => setTargetTelegramId(event.target.value)}
              placeholder="Masalan: 123456789"
            />

            <Textarea
              value={targetMessage}
              onChange={(event) => setTargetMessage(event.target.value)}
              placeholder="Aniq bir foydalanuvchiga yuboriladigan matn"
            />
            <Button onClick={handleSendOne} disabled={sendOneMutation.isPending}>
              {sendOneMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Target xabar yuborish
            </Button>
          </div>
        </GlassCard>

        <GlassCard className="space-y-3 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Users className="size-4" />
            Userlar
          </div>
          <Input
            value={searchUsers}
            onChange={(event) => setSearchUsers(event.target.value)}
            placeholder="Ism, username, telefon yoki telegram ID bo&apos;yicha qidirish"
          />
          <div className="space-y-2">
            {(usersQuery.data?.items || []).map((user) => (
              <button
                type="button"
                key={user.id}
                className="w-full rounded-[10px] border border-[var(--border)] p-3 text-left hover:bg-[var(--muted)]"
                onClick={() => {
                  setSelectedUserId(user.id)
                  setTargetTelegramId(user.telegramId || "")
                }}
              >
                <p className="text-sm font-medium">{formatName(user)}</p>
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  ID: {user.id} | TG: {user.telegramId} | Telefon: {user.phone || "-"}
                </p>
              </button>
            ))}
            {usersQuery.isLoading ? <SkeletonCard /> : null}
          </div>
        </GlassCard>

        <GlassCard className="space-y-3 p-4">
          <p className="text-sm font-semibold">Tanlangan user tafsiloti</p>
          {!selectedUserId ? (
            <p className="text-xs text-[color:var(--muted-foreground)]">Avval user tanlang.</p>
          ) : selectedUserDetails.isLoading ? (
            <SkeletonCard />
          ) : selectedUserDetails.data ? (
            <div className="space-y-3">
              <div className="rounded-[10px] border border-[var(--border)] p-3">
                <p className="text-sm font-medium">
                  {formatName(selectedUserDetails.data.user)} ({selectedUserDetails.data.user.telegramId})
                </p>
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  Telefon: {selectedUserDetails.data.user.phone || "-"}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium">Kontaktlar: {selectedUserDetails.data.contacts.length}</p>
                <div className="space-y-1">
                  {selectedUserDetails.data.contacts.slice(0, 10).map((contact) => (
                    <p key={contact.id} className="text-xs text-[color:var(--muted-foreground)]">
                      - {contact.name} ({contact.phone || "-"})
                    </p>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium">Qarzlar: {selectedUserDetails.data.debts.length}</p>
                <div className="space-y-1">
                  {selectedUserDetails.data.debts.slice(0, 10).map((debt) => (
                    <p key={debt.id} className="text-xs text-[color:var(--muted-foreground)]">
                      - {debt.type} | {debt.status} | {Number(debt.amount).toLocaleString("uz-UZ")} {debt.currency}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[var(--destructive)]">User ma&apos;lumotini olib bo&apos;lmadi.</p>
          )}
        </GlassCard>

        <GlassCard className="space-y-3 p-4">
          <p className="text-sm font-semibold">Qarzlar (global ko&apos;rinish)</p>
          <Input
            value={searchDebts}
            onChange={(event) => setSearchDebts(event.target.value)}
            placeholder="Qarz egasi, contact yoki telegram ID bo&apos;yicha qidirish"
          />
          <div className="grid grid-cols-2 gap-2">
            <Select value={debtType} onValueChange={(value) => setDebtType(value as typeof debtType)}>
              <SelectTrigger>
                <SelectValue placeholder="Turi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="given">Bergan</SelectItem>
                <SelectItem value="taken">Olgan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={debtStatus} onValueChange={(value) => setDebtStatus(value as typeof debtStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="pending">pending</SelectItem>
                <SelectItem value="partial">partial</SelectItem>
                <SelectItem value="paid">paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            {(debtsQuery.data?.items || []).slice(0, 20).map((debt) => (
              <p key={debt.id} className="rounded-[10px] border border-[var(--border)] p-2 text-xs">
                {debt.ownerFirstName} {debt.ownerLastName || ""} ({debt.ownerTelegramId}) | {debt.contactName || "-"} |{" "}
                {Number(debt.amount).toLocaleString("uz-UZ")} {debt.currency} | {debt.type}/{debt.status}
              </p>
            ))}
            {debtsQuery.isLoading ? <SkeletonCard /> : null}
          </div>
        </GlassCard>
      </div>
    </AppLayout>
  )
}
