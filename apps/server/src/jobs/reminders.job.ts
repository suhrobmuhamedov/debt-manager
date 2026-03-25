import { sendDailyDueSoonReminderDigests } from '../services/notification.service';

let remindersInterval: NodeJS.Timeout | null = null;
let isRunning = false;

const runReminders = async () => {
	if (isRunning) {
		return;
	}

	isRunning = true;
	try {
		const result = await sendDailyDueSoonReminderDigests();
		if (result.processedUsers > 0) {
			console.info(
				`[reminders] processedUsers=${result.processedUsers} sentUsers=${result.sentUsers}`
			);
		}
	} catch (error) {
		console.error('[reminders] job failed', error);
	} finally {
		isRunning = false;
	}
};

export const startRemindersJob = () => {
	if (remindersInterval) {
		return;
	}

	void runReminders();
	remindersInterval = setInterval(() => {
		void runReminders();
	}, 60 * 60 * 1000);
};
