import { useRoute } from 'wouter';
import { useLocation } from 'wouter';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { DebtItem } from '../components/dashboard/DebtItem';
import { trpc } from '../lib/trpc';
import { formatCurrency } from '../lib/formatters';
import { formatPhone, getAvatarColor, getInitials } from '../lib/contact-utils';
import { useModalStore } from '../store/modalStore';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { BackButton } from '../components/common/BackButton';
import { GlassButton } from '../components/ui/GlassButton';

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
  const sortedDebts = [...debts].sort((a, b) => {
    const aPaid = a.status === 'paid' ? 1 : 0;
    const bPaid = b.status === 'paid' ? 1 : 0;
    if (aPaid !== bPaid) {
      return aPaid - bPaid;
    }
    const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bCreated - aCreated;
  });

  return (
    <AppLayout>
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <BackButton fallback="/contacts" label={t('common.back')} />
          <GlassButton
            onClick={() => open('CREATE_DEBT', { contactId })}
            className="h-12 gap-2 px-6 text-sm font-semibold whitespace-nowrap"
          >
            + {t('debts.add')}
          </GlassButton>
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
              <p className="numeric-text mt-1 text-sm font-semibold text-emerald-600">{formatCurrency(stats.totalGiven, 'UZS')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3">
              <p className="text-[11px] text-muted-foreground">{t('contacts.totalTaken')}</p>
              <p className="numeric-text mt-1 text-sm font-semibold text-rose-600">{formatCurrency(stats.totalTaken, 'UZS')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3">
              <p className="text-[11px] text-muted-foreground">{t('contacts.activeDebts')}</p>
              <p className="numeric-text mt-1 text-sm font-semibold">{stats.activeDebtsCount}</p>
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

          {!sortedDebts.length ? (
            <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
              {t('contacts.noDebts')}
            </div>
          ) : (
            sortedDebts.map((debt) => (
              <DebtItem
                key={debt.id}
                id={debt.id}
                contactName={contact.name}
                amount={Math.max(Number(debt.amount) - Number(debt.paidAmount), 0)}
                currency={debt.currency}
                type={debt.type}
                status={debt.status}
                returnDate={debt.returnDate ? String(debt.returnDate).split('T')[0] : null}
                paidAt={debt.paidAt ? String(debt.paidAt).split('T')[0] : null}
                onClick={() => open('EDIT_DEBT', { debtId: debt.id })}
              />
            ))
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
