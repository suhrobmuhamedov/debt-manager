import { Badge } from '../ui/badge';
import { CardContent } from '../ui/card';
import { formatCurrency } from '../../lib/formatters';
import { formatPhone, getAvatarColor, getInitials } from '../../lib/contact-utils';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';

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
		<GlassCard
			onClick={() => onClick(contact.id)}
			className="cursor-pointer"
		>
			<CardContent className="p-0">
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
						<Badge
							variant="secondary"
							className="border border-white/40 bg-white/20 text-foreground backdrop-blur-md dark:border-white/20 dark:bg-white/10"
						>
							{contact.activeDebtsCount} {t('contacts.activeDebts').toLowerCase()}
						</Badge>
						<p className="numeric-text text-xs font-medium text-muted-foreground">
							{formatCurrency(contact.totalAmount || 0, 'UZS')}
						</p>
						<GlassButton
							type="button"
							variant="glass"
							className="px-3 py-2 text-sm"
							onClick={(event) => {
								event.stopPropagation();
								onAddDebt(contact.id);
							}}
						>
							+ {t('debts.add')}
						</GlassButton>
					</div>
				</div>
			</CardContent>
		</GlassCard>
	);
};
