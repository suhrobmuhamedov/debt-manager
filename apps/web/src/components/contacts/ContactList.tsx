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
};

export const ContactList = ({
	contacts,
	hasSearch,
	onAddClick,
	onContactClick,
}: ContactListProps) => {
	if (!contacts.length) {
		return <EmptyContacts hasSearch={hasSearch} onAddClick={onAddClick} />;
	}

	return (
		<div className="space-y-3">
			{contacts.map((contact, index) => (
				<div
					key={contact.id}
					className="transition-all duration-200"
					style={{
						opacity: 1,
						transform: 'translateY(0)',
						transitionDelay: `${index * 24}ms`,
					}}
				>
					<ContactCard contact={contact} onClick={onContactClick} />
				</div>
			))}
		</div>
	);
};
