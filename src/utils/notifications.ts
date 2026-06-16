import admin from 'firebase-admin';

let initialized = false;

const getMessaging = (): admin.messaging.Messaging => {
  if (!initialized) {
    const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!json) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON env var is required');
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(json)) });
    initialized = true;
  }
  return admin.messaging();
};

export const sendEventReminder = async (eventTitle: string, pushTokens: string[]): Promise<void> => {
  if (!pushTokens.length) return;

  const response = await getMessaging().sendEachForMulticast({
    tokens: pushTokens,
    notification: {
      title: 'Class starting soon',
      body: `${eventTitle} starts in 30 minutes`,
    },
    android: { priority: 'high' },
  });

  if (response.failureCount > 0) {
    console.error(`Push notification: ${response.failureCount} of ${pushTokens.length} failed`);
  }
};
