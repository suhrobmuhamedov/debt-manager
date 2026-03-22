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

export const ContactDetail = () => {
  const [match, params] = useRoute('/contacts/:id');
  const [, navigate] = useLocation();
  const { open } = useModalStore();
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (!match) return null;

  const contactId = Number(params?.id);
  const utils = trpc.useUtils();
  const detailQuery = trpc.contacts.getById.useQuery({ id: contactId }, { enabled: Number.isFinite(contactId) });

  const deleteMutation = trpc.contacts.delete.useMutation({
    onSuccess: async () => {
      await utils.contacts.getAll.invalidate();
      toast.success('Kontakt o\'chirildi');
      navigate('/contacts');
    },
    onError: (error) => {
      toast.error(error.message || 'Kontaktni o\'chirishda xatolik yuz berdi');
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
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Kontakt ma'lumotlarini yuklab bo'lmadi.
          </div>
        </div>
      </AppLayout>
    );
  }

  const { contact, debts, stats } = detailQuery.data;

  return (
    <AppLayout>
      <div className="space-y-4 p-4">
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
                    <p className="text-sm text-muted-foreground">Telefon raqam kiritilmagan</p>
                  )}
                </div>
              </div>

              <Badge variant={stats.activeDebtsCount > 0 ? 'destructive' : 'secondary'}>
                {stats.activeDebtsCount} ta aktiv
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="py-3">
              <p className="text-[11px] text-muted-foreground">Berilgan</p>
              <p className="mt-1 text-sm font-semibold text-emerald-600">{formatCurrency(stats.totalGiven, 'UZS')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3">
              <p className="text-[11px] text-muted-foreground">Olingan</p>
              <p className="mt-1 text-sm font-semibold text-rose-600">{formatCurrency(stats.totalTaken, 'UZS')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3">
              <p className="text-[11px] text-muted-foreground">Aktiv qarz</p>
              <p className="mt-1 text-sm font-semibold">{stats.activeDebtsCount} ta</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" variant="outline" onClick={() => open('EDIT_CONTACT', { contactId })}>
            Tahrirlash
          </Button>
          <Button className="flex-1" variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            O'chirish
          </Button>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Qarzlar ro'yxati</h2>

          {!debts.length ? (
            <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
              Bu kontakt bo'yicha qarzlar topilmadi.
            </div>
          ) : (
            debts.map((debt) => {
              const amount = Math.max(Number(debt.amount) - Number(debt.paidAmount), 0);
              const isGiven = debt.type === 'given';

              return (
                <Card key={debt.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className={`text-sm font-semibold ${isGiven ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isGiven ? 'Berilgan' : 'Olingan'}: {formatCurrency(amount, debt.currency || 'UZS')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Berilgan sana: {formatDate(debt.givenDate)}
                        </p>
                        {debt.returnDate && (
                          <p className="text-xs text-muted-foreground">
                            Qaytarish: {formatDate(debt.returnDate)}
                          </p>
                        )}
                      </div>
                      <Badge variant={debt.status === 'paid' ? 'secondary' : 'outline'}>
                        {debt.status === 'paid' ? 'To\'langan' : debt.status === 'partial' ? 'Qisman' : 'Kutilmoqda'}
                      </Badge>
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
              <DialogTitle>Kontaktni o'chirish</DialogTitle>
              <DialogDescription>
                Haqiqatan ham ushbu kontaktni o'chirmoqchimisiz? Agar aktiv qarzlar mavjud bo'lsa, o'chirishga ruxsat berilmaydi.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Bekor qilish
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'O\'chirilmoqda...' : 'O\'chirish'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};
