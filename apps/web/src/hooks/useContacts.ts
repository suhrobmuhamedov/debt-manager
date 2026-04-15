import { useMemo, useState } from 'react';
import { trpc } from '../lib/trpc';
import { isDesignMode } from '../lib/design-mode';
import { getMockContacts } from '../lib/mock-data';

type ContactItem = {
	id: number;
	name: string;
	phone: string | null;
	note: string | null;
	activeDebtsCount: number;
	totalAmount: number;
};

export const useContacts = () => {
	const [search, setSearch] = useState('');

	const contactsQuery = trpc.contacts.getAll.useQuery(undefined, {
		enabled: !isDesignMode,
		staleTime: 30_000,
	});

	const filteredContacts = useMemo(() => {
		const all = (isDesignMode ? getMockContacts() : ((contactsQuery.data || []) as ContactItem[])) as ContactItem[];
		const keyword = search.trim().toLowerCase();

		if (!keyword) return all;

		return all.filter((contact) => {
			const byName = contact.name.toLowerCase().includes(keyword);
			const byPhone = (contact.phone || '').toLowerCase().includes(keyword);
			return byName || byPhone;
		});
	}, [contactsQuery.data, search]);

	return {
		search,
		setSearch,
		contacts: filteredContacts,
		isLoading: isDesignMode ? false : contactsQuery.isLoading,
		isFetching: isDesignMode ? false : contactsQuery.isFetching,
		error: isDesignMode ? null : contactsQuery.error,
		refetch: isDesignMode ? async () => undefined : contactsQuery.refetch,
	};
};
