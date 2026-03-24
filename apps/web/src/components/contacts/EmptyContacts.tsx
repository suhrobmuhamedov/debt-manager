import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { useTranslation } from 'react-i18next';

type EmptyContactsProps = {
	hasSearch: boolean;
	onAddClick: () => void;
};

export const EmptyContacts = ({ hasSearch, onAddClick }: EmptyContactsProps) => {
	const { t } = useTranslation();

	return (
		<GlassCard className="border-dashed border-white/30 p-6 text-center">
			<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xl">
				👥
			</div>
			<h3 className="text-base font-semibold text-foreground">
				{hasSearch ? t('contacts.searchEmpty') : t('contacts.empty')}
			</h3>
			<p className="mt-1 text-sm text-muted-foreground">
				{hasSearch ? t('contacts.searchHint') : t('contacts.emptyHint')}
			</p>
			{!hasSearch && (
				<GlassButton variant="glass" className="mt-4" onClick={onAddClick}>
					+ {t('contacts.add')}
				</GlassButton>
			)}
		</GlassCard>
	);
};
