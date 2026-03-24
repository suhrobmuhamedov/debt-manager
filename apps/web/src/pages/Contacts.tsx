import { AppLayout } from '../components/layout/AppLayout';
import { Input } from '../components/ui/input';
import { ContactList } from '../components/contacts/ContactList';
import { useContacts } from '../hooks/useContacts';
import { useModalStore } from '../store/modalStore';
import { useLocation } from 'wouter';
import { RefreshCw, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BackButton } from '../components/common/BackButton';
import { GlassButton } from '../components/ui/GlassButton';
import { GlassCard } from '../components/ui/GlassCard';

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
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <BackButton fallback="/" label={t('common.back')} />
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-foreground">{t('contacts.title')}</h1>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <GlassButton
                variant="glass"
                onClick={() => refetch()}
                disabled={isFetching}
                className="h-12 gap-2 flex-1 px-4 text-sm font-semibold sm:flex-none sm:whitespace-nowrap"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                {t('contacts.refresh')}
              </GlassButton>
              <GlassButton
                onClick={handleAddClick}
                variant="glass"
                className="h-12 flex-1 px-6 text-sm font-semibold sm:flex-none sm:whitespace-nowrap"
              >
                + {t('contacts.add')}
              </GlassButton>
            </div>
          </div>
        </div>

        <GlassCard className="relative p-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('contacts.search')}
            className="h-11 border-transparent bg-transparent pl-9"
          />
        </GlassCard>

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
