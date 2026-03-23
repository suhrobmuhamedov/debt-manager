import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { formatCurrency } from '../../lib/formatters';
import { formatPhone, getAvatarColor, getInitials } from '../../lib/contact-utils';
import { useTranslation } from 'react-i18next';

type ContactCardProps = {
	contact: {
		id: number;
		name: string;
		phone: string | null;
		activeDebtsCount: number;
		totalAmount: number;
	};
	onClick: (id: number) => void;
	onAddDebt: (id: number) => void;
};

export const ContactCard = ({ contact, onClick, onAddDebt }: ContactCardProps) => {
	const { t } = useTranslation();

	return (
		<Card
			onClick={() => onClick(contact.id)}
			className="cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
		>
			<CardContent className="py-3">
				<div className="flex items-center justify-between gap-3">
					<div className="flex min-w-0 items-center gap-3">
						<div
							className={`h-11 w-11 shrink-0 rounded-full ${getAvatarColor(contact.name)} flex items-center justify-center text-sm font-semibold`}
							aria-hidden
						>
							{getInitials(contact.name)}
						</div>

						<div className="min-w-0">
							<p className="truncate text-sm font-semibold text-foreground">{contact.name}</p>
							<p className="truncate text-xs text-muted-foreground">
								{contact.phone ? formatPhone(contact.phone) : t('contacts.noPhone')}
							</p>
						</div>
					</div>

					<div className="flex flex-col items-end gap-1">
						<Badge variant={contact.activeDebtsCount > 0 ? 'destructive' : 'secondary'}>
							{contact.activeDebtsCount} {t('contacts.activeDebts').toLowerCase()}
						</Badge>
						<p className="text-xs font-medium text-muted-foreground">
							{formatCurrency(contact.totalAmount || 0, 'UZS')}
						</p>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={(event) => {
								event.stopPropagation();
								onAddDebt(contact.id);
							}}
						>
							+ {t('debts.add')}
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
