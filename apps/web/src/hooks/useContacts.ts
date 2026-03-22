import { useMemo, useState } from 'react';
import { trpc } from '../lib/trpc';

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
		staleTime: 30_000,
	});

	const filteredContacts = useMemo(() => {
		const all = (contactsQuery.data || []) as ContactItem[];
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
		isLoading: contactsQuery.isLoading,
		isFetching: contactsQuery.isFetching,
		error: contactsQuery.error,
		refetch: contactsQuery.refetch,
	};
};
