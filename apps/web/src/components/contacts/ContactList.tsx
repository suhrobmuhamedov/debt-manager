import { ContactCard } from './ContactCard';
import { EmptyContacts } from './EmptyContacts';

type ContactListItem = {
	id: number;
	name: string;
	phone: string | null;
	activeDebtsCount: number;
	totalAmount: number;
};

type ContactListProps = {
	contacts: ContactListItem[];
	hasSearch: boolean;
	onAddClick: () => void;
	onContactClick: (id: number) => void;
	onContactAddDebt: (id: number) => void;
};

export const ContactList = ({
	contacts,
	hasSearch,
	onAddClick,
	onContactClick,
	onContactAddDebt,
}: ContactListProps) => {
	if (!contacts.length) {
		return <EmptyContacts hasSearch={hasSearch} onAddClick={onAddClick} />;
	}

	return (
		<div className="space-y-3">
			{contacts.map((contact, index) => (
				<div
					key={contact.id}
					className="stagger-item"
					style={{
						animationDelay: `${index * 42}ms`,
					}}
				>
					<ContactCard contact={contact} onClick={onContactClick} onAddDebt={onContactAddDebt} />
				</div>
			))}
		</div>
	);
};
