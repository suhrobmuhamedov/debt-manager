import { FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { isValidPhone, normalizePhone } from '../../lib/contact-utils';

export type DebtFormValues = {
  contactId: number;
  amount: number;
  currency: 'UZS' | 'USD' | 'EUR';
  type: 'given' | 'taken';
  givenDate: string;
  returnDate: string;
  note?: string;
};

type ContactOption = {
  id: number;
  name: string;
};

type DebtFormProps = {
  contacts: ContactOption[];
  isSubmitting?: boolean;
  submitLabel: string;
  initialContactId?: number;
  lockContact?: boolean;
  onQuickAddContact?: (values: { name: string; phone: string }) => Promise<{ id: number; name: string }>;
  onCancel: () => void;
  onSubmit: (values: DebtFormValues) => Promise<void>;
};

const toDateOnly = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getTodayString = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString().split('T')[0];
};

const maskPhoneInput = (value: string): string => {
  const hasPlus = value.trim().startsWith('+');
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return hasPlus ? '+' : '';
  }

  if (digits.startsWith('998')) {
    const local = digits.slice(3, 12);
    const g1 = local.slice(0, 2);
    const g2 = local.slice(2, 5);
    const g3 = local.slice(5, 7);
    const g4 = local.slice(7, 9);
    return `+998${g1 ? ` ${g1}` : ''}${g2 ? ` ${g2}` : ''}${g3 ? ` ${g3}` : ''}${g4 ? ` ${g4}` : ''}`;
  }

  const trimmed = digits.slice(0, 15);
  const groups = trimmed.match(/.{1,3}/g) || [];
  return `${hasPlus ? '+' : ''}${groups.join(' ')}`;
};

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
  const { t } = useTranslation();

  const today = getTodayString();
  const defaultContactId = initialContactId ?? contacts[0]?.id;
  const [contactId, setContactId] = useState<string>(defaultContactId ? String(defaultContactId) : '');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<'UZS' | 'USD' | 'EUR'>('UZS');
  const [type, setType] = useState<'given' | 'taken'>('given');
  const [givenDate, setGivenDate] = useState<string>(today);
  const [returnDate, setReturnDate] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [errors, setErrors] = useState<{ amount?: string; returnDate?: string; contactId?: string }>({});
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickAddError, setQuickAddError] = useState('');
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      !isSubmitting &&
      !!contactId &&
      Number(amount) > 0 &&
      !!returnDate
    );
  }, [isSubmitting, contactId, amount, returnDate]);

  const validate = () => {
    const nextErrors: { amount?: string; returnDate?: string; contactId?: string } = {};

    if (!contactId) {
      nextErrors.contactId = t('contacts.nameRequired');
    }

    if (!amount || Number(amount) <= 0) {
      nextErrors.amount = t('common.error');
    }

    if (!returnDate) {
      nextErrors.returnDate = t('debts.returnDateRequired');
    } else {
      const returnDateObj = toDateOnly(returnDate);
      const givenDateObj = toDateOnly(givenDate);
      const todayObj = toDateOnly(getTodayString());

      if (returnDateObj < todayObj) {
        nextErrors.returnDate = t('debts.returnDatePast');
      } else if (returnDateObj <= givenDateObj) {
        nextErrors.returnDate = t('debts.returnDateAfterGiven');
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    await onSubmit({
      contactId: Number(contactId),
      amount: Number(amount),
      currency,
      type,
      givenDate,
      returnDate,
      note: note.trim() || undefined,
    });
  };

  const handleQuickAddContact = async () => {
    if (!onQuickAddContact) {
      return;
    }

    const name = quickName.trim();
    const phone = normalizePhone(quickPhone);

    if (name.length < 2) {
      setQuickAddError(t('contacts.nameTooShort'));
      return;
    }

    if (!isValidPhone(phone)) {
      setQuickAddError(t('contacts.phoneInvalid'));
      return;
    }

    setQuickAddError('');
    setIsQuickAdding(true);
    try {
      const created = await onQuickAddContact({ name, phone });
      setContactId(String(created.id));
      setQuickName('');
      setQuickPhone('');
      setShowQuickAdd(false);
    } finally {
      setIsQuickAdding(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">{t('contacts.name')}</label>
        <select
          value={contactId}
          onChange={(event) => setContactId(event.target.value)}
          disabled={lockContact}
          className="h-11 w-full rounded-xl border border-white/70 bg-white/75 px-3 text-sm text-foreground backdrop-blur-sm dark:border-white/25 dark:bg-slate-700/55 dark:text-white"
        >
          {!contacts.length ? <option value="">Kontakt mavjud emas</option> : null}
          {contacts.map((contact) => (
            <option key={contact.id} value={String(contact.id)}>
              {contact.name}
            </option>
          ))}
        </select>
        {errors.contactId ? <p className="text-xs text-red-600">{errors.contactId}</p> : null}

        {!lockContact && onQuickAddContact ? (
          <div className="rounded-xl border border-white/60 bg-white/60 p-2 backdrop-blur-sm dark:border-white/20 dark:bg-slate-700/40">
            <Button
              type="button"
              variant="outline"
              className={`h-9 w-full transition-all duration-200 ${showQuickAdd ? 'pointer-events-none h-0 overflow-hidden border-0 p-0 opacity-0' : 'opacity-100'}`}
              onClick={() => setShowQuickAdd(true)}
            >
                + {t('contacts.add')}
            </Button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-out ${
                showQuickAdd ? 'max-h-80 translate-y-0 opacity-100 pt-1' : 'max-h-0 -translate-y-2 opacity-0'
              }`}
            >
                <div className="space-y-2 pt-1">
                <Input
                  value={quickName}
                  onChange={(event) => setQuickName(event.target.value)}
                  placeholder={t('contacts.namePlaceholder')}
                  className="h-10 border-white/70 bg-white/75 dark:border-white/25 dark:bg-slate-700/55"
                />
                <Input
                  value={quickPhone}
                  onChange={(event) => setQuickPhone(maskPhoneInput(event.target.value))}
                  placeholder={t('contacts.phonePlaceholder')}
                  className="h-10 border-white/70 bg-white/75 dark:border-white/25 dark:bg-slate-700/55"
                />
                <p className="text-[11px] text-muted-foreground">Format: +998 90 123 45 67</p>
                {quickAddError ? <p className="text-xs text-red-600">{quickAddError}</p> : null}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="h-9 flex-1"
                    disabled={isQuickAdding}
                    onClick={handleQuickAddContact}
                  >
                    {isQuickAdding ? t('common.loading') : t('contacts.save')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 flex-1"
                    onClick={() => {
                      setShowQuickAdd(false);
                      setQuickAddError('');
                    }}
                  >
                    {t('contacts.cancel')}
                  </Button>
                </div>
                </div>
              </div>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t('debts.amount')}</label>
          <Input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            type="number"
            min={0}
            step="0.01"
            className="border-white/70 bg-white/75 dark:border-white/25 dark:bg-slate-700/55"
          />
          {errors.amount ? <p className="text-xs text-red-600">{errors.amount}</p> : null}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t('debts.currency')}</label>
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value as 'UZS' | 'USD' | 'EUR')}
            className="h-11 w-full rounded-xl border border-white/70 bg-white/75 px-3 text-sm text-foreground backdrop-blur-sm dark:border-white/25 dark:bg-slate-700/55 dark:text-white"
          >
            <option value="UZS">UZS</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">{t('debts.title')}</label>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" className="h-11" variant={type === 'given' ? 'default' : 'outline'} onClick={() => setType('given')}>
            {t('debts.given')}
          </Button>
          <Button type="button" className="h-11" variant={type === 'taken' ? 'default' : 'outline'} onClick={() => setType('taken')}>
            {t('debts.taken')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t('debts.givenDate')}</label>
          <Input
            type="date"
            value={givenDate}
            onChange={(event) => setGivenDate(event.target.value)}
            className="border-white/70 bg-white/75 dark:border-white/25 dark:bg-slate-700/55"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t('debts.returnDate')}</label>
          <Input
            type="date"
            value={returnDate}
            onChange={(event) => setReturnDate(event.target.value)}
            min={today}
            className="border-white/70 bg-white/75 dark:border-white/25 dark:bg-slate-700/55"
          />
          {errors.returnDate ? <p className="text-xs text-red-600">{errors.returnDate}</p> : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">{t('debts.note')}</label>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={500}
          rows={3}
          className="border-white/70 bg-white/75 dark:border-white/25 dark:bg-slate-700/55"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="h-11 flex-1" onClick={onCancel}>
          {t('common.close')}
        </Button>
        <Button type="submit" className="h-11 flex-1" disabled={!canSubmit}>
          {isSubmitting ? t('common.loading') : submitLabel}
        </Button>
      </div>
    </form>
  );
};
