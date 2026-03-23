import { FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

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

export const DebtForm = ({ contacts, isSubmitting = false, submitLabel, onCancel, onSubmit }: DebtFormProps) => {
  const { t } = useTranslation();

  const today = getTodayString();
  const [contactId, setContactId] = useState<string>(contacts[0] ? String(contacts[0].id) : '');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<'UZS' | 'USD' | 'EUR'>('UZS');
  const [type, setType] = useState<'given' | 'taken'>('given');
  const [givenDate, setGivenDate] = useState<string>(today);
  const [returnDate, setReturnDate] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [errors, setErrors] = useState<{ amount?: string; returnDate?: string; contactId?: string }>({});

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">{t('contacts.name')}</label>
        <select
          value={contactId}
          onChange={(event) => setContactId(event.target.value)}
          className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm text-foreground dark:bg-slate-900/80 dark:text-white"
        >
          {contacts.map((contact) => (
            <option key={contact.id} value={String(contact.id)}>
              {contact.name}
            </option>
          ))}
        </select>
        {errors.contactId ? <p className="text-xs text-red-600">{errors.contactId}</p> : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t('debts.amount')}</label>
          <Input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min={0} step="0.01" />
          {errors.amount ? <p className="text-xs text-red-600">{errors.amount}</p> : null}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t('debts.currency')}</label>
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value as 'UZS' | 'USD' | 'EUR')}
            className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm text-foreground dark:bg-slate-900/80 dark:text-white"
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
          <Input type="date" value={givenDate} onChange={(event) => setGivenDate(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t('debts.returnDate')}</label>
          <Input type="date" value={returnDate} onChange={(event) => setReturnDate(event.target.value)} min={today} />
          {errors.returnDate ? <p className="text-xs text-red-600">{errors.returnDate}</p> : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">{t('debts.note')}</label>
        <Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} />
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
