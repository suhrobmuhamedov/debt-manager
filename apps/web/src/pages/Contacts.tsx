import { AppLayout } from '../components/layout/AppLayout';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { ContactList } from '../components/contacts/ContactList';
import { useContacts } from '../hooks/useContacts';
import { useModalStore } from '../store/modalStore';
import { useLocation } from 'wouter';
import { RefreshCw, Search, Plus } from 'lucide-react';
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              {t('contacts.refresh')}
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('contacts.search')}
            className="h-10 pl-9"
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

        <Button
          onClick={handleAddClick}
          size="icon"
          className="fixed bottom-24 right-5 h-14 w-14 rounded-full shadow-lg"
          style={{ backgroundColor: 'var(--tg-theme-button-color, #0ea5e9)', color: 'var(--tg-theme-button-text-color, #fff)' }}
          aria-label={t('contacts.add')}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </AppLayout>
  );
};
