import { type FormEvent, useMemo, useState } from "react"
import { ChevronDown } from "lucide-react"
import { useTranslation } from "react-i18next"

import { isValidPhone, normalizePhone } from "../../lib/contact-utils"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"

const UZ_PREFIX = "+998"

export type DebtFormValues = {
  contactId: number
  amount: number
  currency: "UZS" | "USD" | "EUR"
  type: "given" | "taken"
  givenDate: string
  returnDate: string
  note?: string
  twoWayConfirmation: boolean
}

type ContactOption = {
  id: number
  name: string
}

type DebtFormProps = {
  contacts: ContactOption[]
  isSubmitting?: boolean
  submitLabel: string
  initialContactId?: number
  lockContact?: boolean
  onQuickAddContact?: (values: { name: string; phone: string }) => Promise<{ id: number; name: string }>
  onCancel: () => void
  onSubmit: (values: DebtFormValues) => Promise<void>
}

const toDateOnly = (value: string) => {
  const date = new Date(`${value}T00:00:00`)
  date.setHours(0, 0, 0, 0)
  return date
}

const getTodayString = () => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now.toISOString().split("T")[0]
}

const nativeSelectClass =
  "glass-input h-11 w-full appearance-none px-4 pr-10 text-sm text-[color:var(--foreground)] outline-none disabled:pointer-events-none disabled:opacity-50"

export const DebtForm = ({
  contacts,
  isSubmitting = false,
  submitLabel,
  initialContactId,
  lockContact = false,
  onQuickAddContact,
  onCancel,
  onSubmit,
}: DebtFormProps) => {
  const { t } = useTranslation()

  const today = getTodayString()
  const defaultContactId = initialContactId ?? contacts[0]?.id
  const [contactId, setContactId] = useState<string>(defaultContactId ? String(defaultContactId) : "")
  const [amount, setAmount] = useState<string>("")
  const [currency, setCurrency] = useState<"UZS" | "USD" | "EUR">("UZS")
  const [type, setType] = useState<"given" | "taken">("given")
  const [givenDate, setGivenDate] = useState<string>(today)
  const [returnDate, setReturnDate] = useState<string>("")
  const [note, setNote] = useState<string>("")
  const [twoWayConfirmation, setTwoWayConfirmation] = useState(false)
  const [errors, setErrors] = useState<{ amount?: string; returnDate?: string; contactId?: string }>({})
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickName, setQuickName] = useState("")
  const [quickPhone, setQuickPhone] = useState("")
  const [quickAddError, setQuickAddError] = useState("")
  const [isQuickAdding, setIsQuickAdding] = useState(false)

  const canSubmit = useMemo(() => {
    return !isSubmitting && !!contactId && Number(amount) > 0 && !!returnDate
  }, [isSubmitting, contactId, amount, returnDate])

  const validate = () => {
    const nextErrors: { amount?: string; returnDate?: string; contactId?: string } = {}

    if (!contactId) {
      nextErrors.contactId = t("contacts.nameRequired")
    }

    if (!amount || Number(amount) <= 0) {
      nextErrors.amount = t("common.error")
    }

    if (!returnDate) {
      nextErrors.returnDate = t("debts.returnDateRequired")
    } else {
      const returnDateObj = toDateOnly(returnDate)
      const givenDateObj = toDateOnly(givenDate)
      const todayObj = toDateOnly(getTodayString())

      if (returnDateObj < todayObj) {
        nextErrors.returnDate = t("debts.returnDatePast")
      } else if (returnDateObj <= givenDateObj) {
        nextErrors.returnDate = t("debts.returnDateAfterGiven")
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) {
      return
    }

    await onSubmit({
      contactId: Number(contactId),
      amount: Number(amount),
      currency,
      type,
      givenDate,
      returnDate,
      note: note.trim() || undefined,
      twoWayConfirmation,
    })
  }

  const handleQuickAddContact = async () => {
    if (!onQuickAddContact) {
      return
    }

    const name = quickName.trim()
    const phone = normalizePhone(`${UZ_PREFIX}${quickPhone}`)

    if (name.length < 2) {
      setQuickAddError(t("contacts.nameTooShort"))
      return
    }

    if (!isValidPhone(phone)) {
      setQuickAddError(t("contacts.phoneInvalid"))
      return
    }

    setQuickAddError("")
    setIsQuickAdding(true)
    try {
      const created = await onQuickAddContact({ name, phone })
      setContactId(String(created.id))
      setQuickName("")
      setQuickPhone("")
      setShowQuickAdd(false)
    } finally {
      setIsQuickAdding(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[color:var(--muted-foreground)]">{t("contacts.name")}</label>
        <div className="relative">
          <select
            value={contactId}
            onChange={(event) => setContactId(event.target.value)}
            disabled={lockContact}
            className={nativeSelectClass}
          >
            {!contacts.length ? <option value="">Kontakt mavjud emas</option> : null}
            {contacts.map((contact) => (
              <option key={contact.id} value={String(contact.id)}>
                {contact.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
        </div>
        {errors.contactId ? <p className="text-xs text-[var(--destructive)]">{errors.contactId}</p> : null}

        {!lockContact && onQuickAddContact ? (
          <div className="rounded-[10px] border border-[color:var(--border)] bg-[color:var(--card)] p-3">
            {!showQuickAdd ? (
              <Button type="button" variant="outline" className="h-9 w-full" onClick={() => setShowQuickAdd(true)}>
                + {t("contacts.add")}
              </Button>
            ) : (
              <div className="space-y-3">
                <Input
                  value={quickName}
                  onChange={(event) => setQuickName(event.target.value)}
                  placeholder={t("contacts.namePlaceholder")}
                  className="h-10"
                />
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[color:var(--foreground)]">
                    {UZ_PREFIX}
                  </span>
                  <Input
                    value={quickPhone}
                    onChange={(event) => setQuickPhone(event.target.value.replace(/\D/g, "").slice(0, 9))}
                    placeholder="90 123 45 67"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={9}
                    className="h-10 pl-14"
                  />
                </div>
                <p className="text-[11px] text-[color:var(--muted-foreground)]">{t("contacts.phoneFormatHint")}</p>
                {quickAddError ? <p className="text-xs text-[var(--destructive)]">{quickAddError}</p> : null}
                <div className="flex gap-2">
                  <Button type="button" className="h-9 flex-1" disabled={isQuickAdding} onClick={handleQuickAddContact}>
                    {isQuickAdding ? t("common.loading") : t("contacts.save")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 flex-1"
                    onClick={() => {
                      setShowQuickAdd(false)
                      setQuickAddError("")
                    }}
                  >
                    {t("contacts.cancel")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[color:var(--muted-foreground)]">{t("debts.amount")}</label>
          <Input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            type="number"
            min={0}
            step="0.01"
          />
          {errors.amount ? <p className="text-xs text-[var(--destructive)]">{errors.amount}</p> : null}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[color:var(--muted-foreground)]">{t("debts.currency")}</label>
          <div className="relative">
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value as "UZS" | "USD" | "EUR")}
              className={nativeSelectClass}
            >
              <option value="UZS">UZS</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[color:var(--muted-foreground)]">{t("debts.title")}</label>
        <div className="selector-grid cols-2">
          <button
            type="button"
            className="selector-option"
            data-active={type === "given"}
            onClick={() => setType("given")}
          >
            {t("debts.given")}
          </button>
          <button
            type="button"
            className="selector-option"
            data-active={type === "taken"}
            onClick={() => setType("taken")}
          >
            {t("debts.taken")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[color:var(--muted-foreground)]">{t("debts.givenDate")}</label>
          <Input type="date" value={givenDate} onChange={(event) => setGivenDate(event.target.value)} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[color:var(--muted-foreground)]">{t("debts.returnDate")}</label>
          <Input
            type="date"
            value={returnDate}
            onChange={(event) => setReturnDate(event.target.value)}
            min={today}
          />
          {errors.returnDate ? <p className="text-xs text-[var(--destructive)]">{errors.returnDate}</p> : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[color:var(--muted-foreground)]">{t("debts.note")}</label>
        <Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} />
      </div>

      <div className="rounded-[10px] border border-[rgba(161,98,7,0.18)] bg-[var(--debt-taken-light)] p-3">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={twoWayConfirmation}
            onChange={(event) => setTwoWayConfirmation(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[color:var(--border)] text-[var(--foreground)] focus:ring-0"
          />
          <div>
            <p className="text-sm font-medium text-[color:var(--foreground)]">{t("debts.twoWayConfirmLabel")}</p>
            <p className="text-xs text-[color:var(--muted-foreground)]">{t("debts.twoWayConfirmHint")}</p>
          </div>
        </label>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="h-11 flex-1" onClick={onCancel}>
          {t("common.close")}
        </Button>
        <Button type="submit" className="h-11 flex-1" disabled={!canSubmit}>
          {isSubmitting ? t("common.loading") : submitLabel}
        </Button>
      </div>
    </form>
  )
}
