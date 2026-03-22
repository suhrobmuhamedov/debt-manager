import { Button } from '../ui/button';

type EmptyContactsProps = {
	hasSearch: boolean;
	onAddClick: () => void;
};

export const EmptyContacts = ({ hasSearch, onAddClick }: EmptyContactsProps) => {
	return (
		<div className="rounded-xl border border-dashed border-muted-foreground/30 bg-background p-6 text-center">
			<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xl">
				👥
			</div>
			<h3 className="text-base font-semibold text-foreground">
				{hasSearch ? 'Hech narsa topilmadi' : 'Kontaktlar hozircha yo\'q'}
			</h3>
			<p className="mt-1 text-sm text-muted-foreground">
				{hasSearch
					? 'Qidiruv so\'rovini o\'zgartirib qayta urinib ko\'ring.'
					: 'Yangi kontakt qo\'shib qarzlarni qulay boshqaring.'}
			</p>
			{!hasSearch && (
				<Button className="mt-4" onClick={onAddClick}>
					+ Kontakt qo\'shish
				</Button>
			)}
		</div>
	);
};
