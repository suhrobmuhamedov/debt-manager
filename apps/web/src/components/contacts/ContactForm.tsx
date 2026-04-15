import { type FormEvent, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { isValidPhone, normalizePhone } from "../../lib/contact-utils"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"

const UZ_PREFIX = "+998"

const getUzLocalDigits = (phone?: string): string => {
  if (!phone) {
    return ""
  }

  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("998")) {
    return digits.slice(3, 12)
  }

  return digits.slice(0, 9)
}

export type ContactFormValues = {
  name: string
  phone: string
  telegramUsername?: string
  note?: string
}

type ContactFormProps = {
  initialValues?: ContactFormValues
  isSubmitting?: boolean
  submitLabel: string
  onCancel: () => void
  onSubmit: (values: ContactFormValues) => Promise<void>
}

export const ContactForm = ({
  initialValues,
  isSubmitting = false,
  submitLabel,
  onCancel,
  onSubmit,
}: ContactFormProps) => {
  const { t } = useTranslation()
  const [name, setName] = useState(initialValues?.name || "")
  const [phone, setPhone] = useState(getUzLocalDigits(initialValues?.phone))
  const [telegramUsername, setTelegramUsername] = useState(initialValues?.telegramUsername || "")
  const [note, setNote] = useState(initialValues?.note || "")
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})
  const fullPhone = `${UZ_PREFIX}${phone}`

  const canSubmit = useMemo(() => {
    return !isSubmitting && name.trim().length >= 2 && phone.length === 9 && isValidPhone(fullPhone)
  }, [fullPhone, isSubmitting, name, phone.length])

  const validate = () => {
    const nextErrors: { name?: string; phone?: string } = {}

    if (name.trim().length < 2) {
      nextErrors.name = t("contacts.nameTooShort")
    }

    if (!phone.trim()) {
      nextErrors.phone = t("contacts.phoneRequired")
    } else if (phone.length !== 9 || !isValidPhone(fullPhone)) {
      nextErrors.phone = t("contacts.phoneInvalid")
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    await onSubmit({
      name: name.trim(),
      phone: normalizePhone(fullPhone),
      telegramUsername: telegramUsername.trim() || undefined,
      note: note.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[color:var(--muted-foreground)]">{t("contacts.name")}</label>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("contacts.namePlaceholder")}
          autoFocus
          maxLength={100}
        />
        {errors.name ? <p className="text-xs text-[var(--destructive)]">{errors.name}</p> : null}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[color:var(--muted-foreground)]">{t("contacts.phone")}</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[color:var(--foreground)]">
            {UZ_PREFIX}
          </span>
          <Input
            value={phone}
            onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 9))}
            placeholder="90 123 45 67"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={9}
            className="pl-14"
          />
        </div>
        {errors.phone ? <p className="text-xs text-[var(--destructive)]">{errors.phone}</p> : null}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[color:var(--muted-foreground)]">
          {t("contacts.telegramUsername")}
        </label>
        <Input
          value={telegramUsername}
          onChange={(event) => setTelegramUsername(event.target.value)}
          placeholder={t("contacts.telegramUsernamePlaceholder")}
          maxLength={100}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[color:var(--muted-foreground)]">{t("contacts.note")}</label>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={t("contacts.notePlaceholder")}
          maxLength={500}
          rows={4}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isSubmitting}>
          {t("contacts.cancel")}
        </Button>
        <Button type="submit" className="flex-1" disabled={!canSubmit}>
          {isSubmitting ? t("contacts.updating") : submitLabel}
        </Button>
      </div>
    </form>
  )
}
