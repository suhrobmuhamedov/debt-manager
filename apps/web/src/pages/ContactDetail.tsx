import { useRoute } from 'wouter';
import { useLocation } from 'wouter';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { trpc } from '../lib/trpc';
import { formatCurrency, formatDate } from '../lib/formatters';
import { formatPhone, getAvatarColor, getInitials } from '../lib/contact-utils';
import { useModalStore } from '../store/modalStore';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { BackButton } from '../components/common/BackButton';

export const ContactDetail = () => {
  const [match, params] = useRoute('/contacts/:id');
  const [, navigate] = useLocation();
  const { open } = useModalStore();
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { t } = useTranslation();

  if (!match) return null;

  const contactId = Number(params?.id);
  const utils = trpc.useUtils();
  const detailQuery = trpc.contacts.getById.useQuery({ id: contactId }, { enabled: Number.isFinite(contactId) });

  const deleteMutation = trpc.contacts.delete.useMutation({
    onSuccess: async () => {
      await utils.contacts.getAll.invalidate();
      toast.success(t('contacts.deletedSuccess'));
      navigate('/contacts');
    },
    onError: (error) => {
      toast.error(error.message || t('common.error'));
    },
  });

  const handleDelete = async () => {
    await deleteMutation.mutateAsync({ id: contactId });
    setDeleteDialogOpen(false);
  };

  if (detailQuery.isLoading) {
    return (
      <AppLayout>
        <div className="p-4">
          <div className="h-28 animate-pulse rounded-xl bg-muted" />
        </div>
      </AppLayout>
    );
  }

  if (detailQuery.error || !detailQuery.data) {
    return (
      <AppLayout>
        <div className="p-4">
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200">
              {t('contacts.noDetails')}
          </div>
        </div>
      </AppLayout>
    );
  }

  const { contact, debts, stats } = detailQuery.data;

  return (
    <AppLayout>
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <BackButton fallback="/contacts" label={t('common.back')} />
          <Button onClick={() => open('CREATE_DEBT', { contactId })} className="h-9 rounded-lg px-3 text-sm">
            + {t('debts.add')}
          </Button>
        </div>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-bold ${getAvatarColor(contact.name)}`}>
                  {getInitials(contact.name)}
                </div>

                <div className="min-w-0">
                  <h1 className="truncate text-lg font-bold text-foreground">{contact.name}</h1>
                  {contact.phone ? (
                    <a href={`tel:${contact.phone}`} className="text-sm text-primary underline-offset-4 hover:underline">
                      {formatPhone(contact.phone)}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('contacts.noPhone')}</p>
                  )}
                </div>
              </div>

              <Badge variant={stats.activeDebtsCount > 0 ? 'destructive' : 'secondary'}>
                {stats.activeDebtsCount} {t('contacts.activeDebts').toLowerCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="py-3">
              <p className="text-[11px] text-muted-foreground">{t('contacts.totalGiven')}</p>
              <p className="mt-1 text-sm font-semibold text-emerald-600">{formatCurrency(stats.totalGiven, 'UZS')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3">
              <p className="text-[11px] text-muted-foreground">{t('contacts.totalTaken')}</p>
              <p className="mt-1 text-sm font-semibold text-rose-600">{formatCurrency(stats.totalTaken, 'UZS')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3">
              <p className="text-[11px] text-muted-foreground">{t('contacts.activeDebts')}</p>
              <p className="mt-1 text-sm font-semibold">{stats.activeDebtsCount}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" variant="outline" onClick={() => open('EDIT_CONTACT', { contactId })}>
            {t('contacts.edit')}
          </Button>
          <Button className="flex-1" variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            {t('contacts.delete')}
          </Button>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">{t('contacts.detailsTitle')}</h2>

          {!debts.length ? (
            <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
              {t('contacts.noDebts')}
            </div>
          ) : (
            debts.map((debt) => {
              const amount = Math.max(Number(debt.amount) - Number(debt.paidAmount), 0);
              const isGiven = debt.type === 'given';
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const deadline = debt.returnDate ? new Date(debt.returnDate) : null;
              if (deadline) {
                deadline.setHours(0, 0, 0, 0);
              }
              const dayDiff = deadline ? Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
              const countdown = dayDiff < 0
                ? `${Math.abs(dayDiff)} ${t('debts.daysOverdue')}`
                : `${dayDiff} ${t('debts.daysLeft')}`;

              return (
                <Card key={debt.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className={`text-sm font-semibold ${isGiven ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isGiven ? t('debts.given') : t('debts.taken')}: {formatCurrency(amount, debt.currency || 'UZS')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('debts.givenDate')}: {formatDate(debt.givenDate)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('debts.returnDate')}: {deadline ? formatDate(deadline) : '—'}
                        </p>
                        <p className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${dayDiff < 0 ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                          {countdown}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={debt.status === 'paid' ? 'secondary' : 'outline'}>
                          {debt.status === 'paid' ? t('debts.paid') : debt.status === 'partial' ? t('debts.partial') : t('debts.pending')}
                        </Badge>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => open('EDIT_DEBT', { debtId: debt.id })}
                        >
                          {t('contacts.edit')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('contacts.delete')}</DialogTitle>
              <DialogDescription>
                {t('contacts.deleteDescription')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                {t('contacts.cancel')}
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? t('contacts.deleting') : t('contacts.delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};
