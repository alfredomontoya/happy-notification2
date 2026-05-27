import notifee, {
  AndroidImportance,
  RepeatFrequency,
  TriggerType,
} from '@notifee/react-native';

const CHANNEL_ID = 'birthdays';

export async function setupNotifications() {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Cumpleaños',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });

  await notifee.requestPermission();
}

export async function showBirthdayNotification(names: string[]) {
  const title =
    names.length === 1
      ? '🎉 ¡Hoy cumple años!'
      : `🎉 ¡Hoy cumplen años ${names.length} personas!`;

  const body = names.join(', ');

  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId: CHANNEL_ID,
      pressAction: {id: 'default'},
    },
  });
}

export async function scheduleDailyReminder() {
  const date = new Date();
  date.setHours(8, 0, 0, 0);
  if (date.getTime() < Date.now()) {
    date.setDate(date.getDate() + 1);
  }

  await notifee.createTriggerNotification(
    {
      title: 'STMSC Cumpleañeros',
      body: 'Revisa los cumpleaños de hoy',
      android: {
        channelId: CHANNEL_ID,
        pressAction: {id: 'default'},
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
    },
  );
}

export async function cancelAllNotifications() {
  await notifee.cancelAllNotifications();
}
