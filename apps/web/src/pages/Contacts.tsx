import { AppLayout } from '../components/layout/AppLayout';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { ContactList } from '../components/contacts/ContactList';
import { useContacts } from '../hooks/useContacts';
import { useModalStore } from '../store/modalStore';
import { useLocation } from 'wouter';
import { RefreshCw, Search, PlusCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BackButton } from '../components/common/BackButton';

export const Contacts = () => {
  const [, navigate] = useLocation();
  const { open } = useModalStore();
  const { contacts, search, setSearch, isLoading, isFetching, error, refetch } = useContacts();
  const { t } = useTranslation();

  const handleContactClick = (id: number) => {
    navigate(`/contacts/${id}`);
  };

  const handleAddClick = () => {
    open('CREATE_CONTACT');
  };

  const handleAddDebtClick = (contactId: number) => {
    open('CREATE_DEBT', { contactId });
  };

  return (
    <AppLayout>
      <div
        className="relative space-y-4 p-4"
        style={{
          backgroundColor: 'var(--tg-theme-secondary-bg-color, transparent)',
        }}
      >
        <div className="space-y-2">
          <BackButton fallback="/" label={t('common.back')} />
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl font-bold text-foreground">{t('contacts.title')}</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="gap-1 border-white/60 bg-white/35 backdrop-blur-xl dark:border-white/20 dark:bg-slate-900/35"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                {t('contacts.refresh')}
              </Button>
              <Button
                onClick={handleAddClick}
                className="h-10 gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 px-4 text-white shadow-lg shadow-sky-500/30 hover:from-sky-600 hover:to-emerald-600"
              >
                <PlusCircle className="h-4 w-4" />
                {t('contacts.add')}
              </Button>
            </div>
          </div>
        </div>

        <div className="relative rounded-2xl border border-white/60 bg-white/35 p-1 backdrop-blur-xl dark:border-white/20 dark:bg-slate-900/35">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('contacts.search')}
            className="h-10 border-transparent bg-transparent pl-9"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-200">
            {t('contacts.loadError')}
          </div>
        ) : (
          <ContactList
            contacts={contacts}
            hasSearch={Boolean(search.trim())}
            onAddClick={handleAddClick}
            onContactClick={handleContactClick}
            onContactAddDebt={handleAddDebtClick}
          />
        )}
      </div>
    </AppLayout>
  );
};
