import { FormEvent, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { isValidPhone, normalizePhone } from '../../lib/contact-utils';

export type ContactFormValues = {
	name: string;
	phone: string;
	note?: string;
};

type ContactFormProps = {
	initialValues?: ContactFormValues;
	isSubmitting?: boolean;
	submitLabel: string;
	onCancel: () => void;
	onSubmit: (values: ContactFormValues) => Promise<void>;
};

export const ContactForm = ({
	initialValues,
	isSubmitting = false,
	submitLabel,
	onCancel,
	onSubmit,
}: ContactFormProps) => {
	const [name, setName] = useState(initialValues?.name || '');
	const [phone, setPhone] = useState(initialValues?.phone || '');
	const [note, setNote] = useState(initialValues?.note || '');
	const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

	const canSubmit = useMemo(() => {
		return !isSubmitting && name.trim().length >= 2 && isValidPhone(phone);
	}, [isSubmitting, name, phone]);

	const validate = () => {
		const nextErrors: { name?: string; phone?: string } = {};

		if (name.trim().length < 2) {
			nextErrors.name = 'Ism kamida 2 ta harfdan iborat bo\'lishi kerak';
		}

		if (!phone.trim()) {
			nextErrors.phone = 'Telefon raqam majburiy';
		} else if (!isValidPhone(phone)) {
			nextErrors.phone = 'Telefon formati noto\'g\'ri. Masalan: +998901234567';
		}

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		if (!validate()) return;

		await onSubmit({
			name: name.trim(),
			phone: normalizePhone(phone),
			note: note.trim() || undefined,
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-1.5">
				<label className="text-sm font-medium text-foreground">Ism familiya</label>
				<Input
					value={name}
					onChange={(event) => setName(event.target.value)}
					placeholder="Masalan: Otabek Xasanov"
					autoFocus
					maxLength={100}
				/>
				{errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
			</div>

			<div className="space-y-1.5">
				<label className="text-sm font-medium text-foreground">Telefon raqam</label>
				<Input
					value={phone}
					onChange={(event) => setPhone(event.target.value)}
					placeholder="+998901234567"
					type="tel"
					inputMode="numeric"
					pattern="[0-9+]*"
					maxLength={16}
				/>
				{errors.phone && <p className="text-xs text-red-600">{errors.phone}</p>}
			</div>

			<div className="space-y-1.5">
				<label className="text-sm font-medium text-foreground">Izoh (ixtiyoriy)</label>
				<Textarea
					value={note}
					onChange={(event) => setNote(event.target.value)}
					placeholder="Qo\'shimcha ma\'lumot"
					maxLength={500}
					rows={4}
				/>
			</div>

			<div className="flex gap-2 pt-1">
				<Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isSubmitting}>
					Bekor qilish
				</Button>
				<Button type="submit" className="flex-1" disabled={!canSubmit}>
					{isSubmitting ? 'Saqlanmoqda...' : submitLabel}
				</Button>
			</div>
		</form>
	);
};
