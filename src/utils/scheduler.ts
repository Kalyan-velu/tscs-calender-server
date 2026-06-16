import { eventRepository } from '../db/repository/event.repository.js';
import { studentRepository } from '../db/repository/student.repository.js';
import { sendEventReminder } from './notifications.js';

const REMINDER_MINUTES = 30;

const checkAndNotify = async () => {
  try {
    const now = new Date();
    // 1-minute window centered on REMINDER_MINUTES from now — each event falls in this window exactly once
    const windowStart = new Date(now.getTime() + (REMINDER_MINUTES - 0.5) * 60_000);
    const windowEnd = new Date(now.getTime() + (REMINDER_MINUTES + 0.5) * 60_000);

    const upcomingEvents = await eventRepository.all({ from: windowStart, to: windowEnd });
    if (!upcomingEvents.length) return;

    for (const ev of upcomingEvents) {
      if (!ev.batchIds.length) continue;

      const studentsPerBatch = await Promise.all(
        ev.batchIds.map((batchId) => studentRepository.findByBatchId(batchId)),
      );

      const pushTokens = [
        ...new Set(
          studentsPerBatch
            .flat()
            .map((s) => s.pushToken)
            .filter((t): t is string => t !== null && t !== undefined),
        ),
      ];

      if (pushTokens.length) {
        await sendEventReminder(ev.title, pushTokens);
      }
    }
  } catch (err) {
    console.error('Scheduler error:', err);
  }
};

export const startScheduler = (): NodeJS.Timeout => {
  console.log('Push notification scheduler started (checking every 60s)');
  return setInterval(checkAndNotify, 60_000);
};
